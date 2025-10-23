"use client";

import { AnimatePresence, motion } from "framer-motion";
import { AlertCircle, Camera, Check, Image as ImageIcon, RefreshCw, Upload, X } from "lucide-react";
import Image from "next/image";
import React, { useCallback, useEffect, useRef, useState } from "react";

interface CameraCaptureProps {
  onCapture: (file: File) => void;
  onClose: () => void;
  isProcessing?: boolean;
}

export default function CameraCapture({ onCapture, onClose, isProcessing }: CameraCaptureProps) {
  const [mode, setMode] = useState<"select" | "camera" | "preview">("select");
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [capturedFile, setCapturedFile] = useState<File | null>(null);
  const [error, setError] = useState<string>("");
  const [stream, setStream] = useState<MediaStream | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup camera stream on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Start camera stream
  const startCamera = useCallback(async () => {
    try {
      setError("");
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment", width: 1920, height: 1080 },
      });

      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
        setStream(mediaStream);
        setMode("camera");
      }
    } catch (err) {
      setError("Unable to access camera. Please check permissions or use file upload instead.");
      console.error("Camera access error:", err);
    }
  }, []);

  // Stop camera stream
  const stopCamera = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  }, [stream]);

  // Capture photo from video stream
  const capturePhoto = useCallback(() => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;

      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
              setCapturedFile(file);
              setCapturedImage(URL.createObjectURL(blob));
              setMode("preview");
              stopCamera();
            }
          },
          "image/jpeg",
          0.95,
        );
      }
    }
  }, [stopCamera]);

  // Handle file upload
  const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setError("");

      // Validate file type
      const validTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "image/webp",
        "image/heic",
        "image/heif",
      ];
      if (!validTypes.includes(file.type.toLowerCase())) {
        setError("Please upload a valid image file (JPG, PNG, WebP, or HEIC)");
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError("Image size must be less than 10MB");
        return;
      }

      setCapturedFile(file);
      setCapturedImage(URL.createObjectURL(file));
      setMode("preview");
    }
  }, []);

  // Submit captured image
  const handleSubmit = useCallback(() => {
    if (capturedFile) {
      onCapture(capturedFile);
    }
  }, [capturedFile, onCapture]);

  // Reset to initial state
  const handleRetake = useCallback(() => {
    setCapturedImage(null);
    setCapturedFile(null);
    setMode("select");
    setError("");
    stopCamera();
  }, [stopCamera]);

  // Handle close
  const handleClose = useCallback(() => {
    stopCamera();
    onClose();
  }, [stopCamera, onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        className="bg-background rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-xl font-semibold text-foreground">Capture Logbook Page</h2>
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="p-2 hover:bg-muted rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <AnimatePresence mode="wait">
            {/* Mode: Select Input Method */}
            {mode === "select" && (
              <motion.div
                key="select"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <div className="text-center mb-8">
                  <ImageIcon className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">
                    Take a photo or upload an image of your SIWES logbook page
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Camera Option */}
                  <button
                    onClick={startCamera}
                    className="group relative p-8 bg-card hover:bg-muted border border-border rounded-xl transition-all hover:scale-105"
                  >
                    <Camera className="w-12 h-12 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-medium text-foreground mb-1">Use Camera</h3>
                    <p className="text-sm text-muted-foreground">
                      Take a photo with your device camera
                    </p>
                  </button>

                  {/* Upload Option */}
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="group relative p-8 bg-card hover:bg-muted border border-border rounded-xl transition-all hover:scale-105"
                  >
                    <Upload className="w-12 h-12 mx-auto mb-3 text-primary group-hover:scale-110 transition-transform" />
                    <h3 className="font-medium text-foreground mb-1">Upload Image</h3>
                    <p className="text-sm text-muted-foreground">
                      Select an existing photo from your device
                    </p>
                  </button>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />

                {/* Tips */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <h4 className="font-medium text-sm text-foreground mb-2">
                    Tips for best results:
                  </h4>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Ensure the entire week&apos;s entries (Monday-Friday) are visible</li>
                    <li>• Use good lighting and avoid shadows</li>
                    <li>• Keep the page flat and camera steady</li>
                    <li>• Make sure text is clear and readable</li>
                  </ul>
                </div>
              </motion.div>
            )}

            {/* Mode: Camera */}
            {mode === "camera" && (
              <motion.div
                key="camera"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="relative bg-black rounded-lg overflow-hidden aspect-[4/3]">
                  <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />

                  {/* Camera overlay guides */}
                  <div className="absolute inset-0 pointer-events-none">
                    <div className="absolute inset-4 border-2 border-white/30 rounded-lg"></div>
                    <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                      <div className="w-20 h-20 border-2 border-white"></div>
                    </div>
                  </div>
                </div>

                <canvas ref={canvasRef} className="hidden" />

                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleRetake}
                    className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={capturePhoto}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors flex items-center gap-2"
                  >
                    <Camera className="w-5 h-5" />
                    Capture Photo
                  </button>
                </div>
              </motion.div>
            )}

            {/* Mode: Preview */}
            {mode === "preview" && capturedImage && (
              <motion.div
                key="preview"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-4"
              >
                <div className="relative bg-muted rounded-lg overflow-hidden">
                  <Image
                    src={capturedImage}
                    alt="Captured logbook page"
                    width={800}
                    height={400}
                    className="w-full h-auto max-h-[400px] object-contain"
                    style={{ objectFit: "contain" }}
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5" />
                    <div className="text-sm text-blue-800 dark:text-blue-200">
                      <p className="font-medium mb-1">Review your image</p>
                      <p>
                        Make sure all Monday-Friday entries are clearly visible before processing.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center gap-4">
                  <button
                    onClick={handleRetake}
                    disabled={isProcessing}
                    className="px-6 py-3 bg-muted text-foreground rounded-lg hover:bg-muted/80 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Retake
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={isProcessing}
                    className="px-8 py-3 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center gap-2"
                  >
                    {isProcessing ? (
                      <>
                        <div className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Check className="w-4 h-4" />
                        Process Image
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Error Display */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-4 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg p-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 mt-0.5" />
                <p className="text-sm text-red-800 dark:text-red-200">{error}</p>
              </div>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
