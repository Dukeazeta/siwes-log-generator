# OCR Processing Documentation

## Overview

SwiftLog includes an AI-powered OCR (Optical Character Recognition) feature that helps you digitize handwritten or printed SIWES logbook pages from **any academic field**. Whether you're in Engineering, Medicine, Agriculture, Sciences, Business, Pharmacy, Architecture, or any other discipline, the system uses Google Cloud Vision for text extraction and AI (Gemini or Groq) for intelligent, context-aware error correction.

## How It Works

### Three-Stage Process

1. **Text Extraction** (Google Vision OCR)
   - Scans your logbook image
   - Extracts all visible text
   - Detects structure and layout

2. **AI Error Correction** (Gemini/Groq)
   - Fixes OCR scanning errors
   - Corrects misspellings
   - Fills in missing words based on context
   - **PRESERVES your original text** - doesn't rewrite!

3. **Post-Processing**
   - Removes dates and metadata
   - Fixes spacing and punctuation
   - Organizes by day (Monday-Friday)

## Key Principle: Preservation Over Perfection

**The AI will NOT rewrite your text.** It only:

- ✅ Fixes OCR scanning errors (e.g., "equipmnt" → "equipment", "measurment" → "measurement")
- ✅ Fills in obviously missing words using context from your field
- ✅ Corrects misspellings due to scanning
- ✅ Works with terminology from ANY academic discipline
- ❌ Does NOT rephrase your sentences
- ❌ Does NOT make your text more formal
- ❌ Does NOT add information you didn't write

### Examples Across Different Fields

#### ✅ CORRECT Behavior (What the AI Does)

**Example 1: Computer Science/IT**

```
Original OCR: Helped with priner confguration. Updated the priner system drvers.
AI Corrected: Helped with printer configuration. Updated the printer system drivers.
```

_Only fixed spelling errors from OCR scanning_

**Example 2: Pharmacy**

```
Original OCR: Dispensd medicatons to patints. Verifed prescripion dosges.
AI Corrected: Dispensed medications to patients. Verified prescription dosages.
```

_Only fixed spelling errors, kept original wording_

**Example 3: Engineering**

```
Original OCR: Asisted in tesing the elctrical curcuit. Measued voltage readings.
AI Corrected: Assisted in testing the electrical circuit. Measured voltage readings.
```

_Only fixed spelling errors, kept original wording_

**Example 4: Agriculture**

```
Original OCR: Inspectd crop yeld and soil conditons. Recordd data for analize.
AI Corrected: Inspected crop yield and soil conditions. Recorded data for analyze.
```

_Only fixed spelling errors, kept original wording_

---

#### ❌ WRONG Behavior (What the AI Does NOT Do)

**Original OCR Text:**

```
Helped with equipment setup
```

**AI Does NOT do this:**

```
Provided comprehensive technical assistance in the systematic configuration and deployment of advanced laboratory equipment with detailed quality assurance protocols.
```

_This rewrites the student's text - the AI is configured NOT to do this_

---

## Configuration

### Environment Variables

Create a `.env.local` file with the following:

```bash
# Required: Google Vision API for OCR
NEXT_PUBLIC_GOOGLE_VISION_API_KEY=your_google_vision_key
# or
GOOGLE_VISION_API_KEY=your_google_vision_key

# Required: At least ONE AI provider
GEMINI_API_KEY=your_gemini_key
# or
GROQ_API_KEY=your_groq_key

# Optional: AI Configuration
GEMINI_MODEL=gemini-2.0-flash-exp        # Default model
AI_TEMPERATURE=0.1                        # Lower = more conservative (0.0-1.0)
AI_MAX_TOKENS=2048                        # Maximum response length
OCR_AI_MAX_CHARS=15000                    # Max OCR text to process
```

### AI Provider Priority

1. **Primary**: Gemini (if `GEMINI_API_KEY` is set)
2. **Fallback**: Groq (if `GROQ_API_KEY` is set)
3. If primary fails, automatically tries fallback

### Temperature Setting

The `AI_TEMPERATURE` controls how creative/conservative the AI is:

- `0.0` - Most conservative (only obvious corrections)
- `0.1` - **Default** (recommended for OCR correction)
- `0.3` - More flexible (might make slight improvements)
- `0.5+` - Creative (may start rephrasing - NOT recommended)

**Recommendation:** Keep at `0.1` or lower for pure OCR correction.

---

## Common OCR Errors Fixed

The system automatically corrects these common scanning mistakes across all fields:

| OCR Error  | Corrected To | Common In             |
| ---------- | ------------ | --------------------- |
| maintance  | maintenance  | All fields            |
| equipmnt   | equipment    | All fields            |
| experment  | experiment   | Sciences, Engineering |
| measurment | measurement  | All fields            |
| analize    | analyze      | All fields            |
| patints    | patients     | Medicine, Pharmacy    |
| medicatons | medications  | Pharmacy, Medicine    |
| documnt    | document     | All fields            |
| procedur   | procedure    | All fields            |
| matrial    | material     | Engineering, Sciences |
| sampl      | sample       | Sciences, Medicine    |

**Note:** The AI uses context to identify field-specific terminology, so it's not limited to these examples.

---

## Usage

### From Manual Log Page

1. Click the camera icon
2. Take a photo of your logbook page
3. Wait for processing (10-30 seconds)
4. Review the extracted text
5. Apply to your log entry
6. Edit any remaining issues manually

### Best Practices

**For Best OCR Results:**

- ✅ Good lighting (no shadows)
- ✅ Clear focus (not blurry)
- ✅ Full page visible
- ✅ Straight angle (not tilted)
- ✅ High contrast (dark text on white paper)

**What to Expect:**

- Monday-Friday activities will be extracted
- Dates and headers will be removed
- Spelling will be corrected (context-aware for your field)
- Your original wording will be preserved
- Field-specific terminology will be recognized (medical, engineering, business, etc.)

---

## API Endpoints

### `/api/ocr/process-with-ai`

**Method:** POST
**Content-Type:** multipart/form-data

**Parameters:**

- `image` (File) - Required: The logbook image
- `weekNumber` (string) - Optional: Week number for metadata
- `useAI` (boolean) - Optional: Enable/disable AI processing (default: true)

**Response:**

```json
{
  "success": true,
  "fullText": "Complete OCR extracted text...",
  "activities": {
    "monday": "Monday's activities...",
    "tuesday": "Tuesday's activities...",
    "wednesday": "Wednesday's activities...",
    "thursday": "Thursday's activities...",
    "friday": "Friday's activities..."
  },
  "confidence": 0.85,
  "warnings": ["Some days need manual review: saturday, sunday"],
  "metadata": {
    "weekNumber": "1",
    "fileName": "logbook.jpg",
    "fileSize": 1234567,
    "aiProcessed": true,
    "processingTime": 12500,
    "aiModel": "gemini-2.0-flash-exp",
    "timestamp": "2024-12-19T10:30:00Z"
  }
}
```

---

## Troubleshooting

### "No AI provider configured"

**Problem:** Neither GEMINI_API_KEY nor GROQ_API_KEY is set.

**Solution:** Add at least one API key to your `.env.local` file:

```bash
GEMINI_API_KEY=your_key_here
```

### "AI processing failed"

**Possible causes:**

1. API key is invalid or expired
2. API quota exceeded
3. Network connectivity issues
4. Model name is incorrect

**Solution:**

- Verify your API key is active
- Check your API usage/quota
- Try the fallback provider by setting both keys
- Review console logs for specific error messages

### Poor OCR Quality

**If the extracted text is inaccurate:**

1. **Retake the photo** with:
   - Better lighting
   - Clearer focus
   - Straight angle

2. **Manually correct** remaining errors:
   - Review extracted text in preview
   - Edit in the manual log form
   - Save corrected version

3. **Adjust settings** (advanced):
   - Increase `AI_TEMPERATURE` slightly (0.2-0.3)
   - Ensure `OCR_AI_MAX_CHARS` is sufficient

### Missing Days

**If some days are not extracted:**

- Check that day names are clearly visible in the image
- Ensure handwriting is legible
- Verify the logbook uses standard day names (Monday, Tuesday, etc.)
- The AI will add placeholders for missing days - review and fill manually

---

## API Key Setup

### Google Cloud Vision API

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a new project or select existing
3. Enable "Cloud Vision API"
4. Create credentials (API Key)
5. Copy the key to `.env.local`

**Pricing:** Free tier includes 1,000 requests/month

### Gemini API

1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Copy to `.env.local`

**Pricing:** Free tier available with rate limits

### Groq API

1. Go to [Groq Console](https://console.groq.com)
2. Sign up and create an API key
3. Copy to `.env.local`

**Pricing:** Free tier available with generous limits

---

## Performance Tips

### Processing Time

- Typical: 10-20 seconds per page
- Depends on: Image size, AI provider, network speed

### Cost Optimization

- Use Groq for faster, cheaper processing
- Use Gemini for higher quality correction
- Enable both for redundancy

### Rate Limits

- Google Vision: 1,800 requests/minute (free tier)
- Gemini: 15 requests/minute (free tier)
- Groq: 30 requests/minute (free tier)

**Tip:** If you hit rate limits, the system will automatically use the fallback provider.

---

## Privacy & Security

- Images are sent to Google Cloud Vision for OCR
- Text is sent to Gemini/Groq for correction
- No data is stored by these services (per their policies)
- Images are not saved on the server
- All processing happens in real-time

**Recommendation:** Review extracted text before saving to ensure no sensitive information is included.

---

## Support

If you encounter issues:

1. Check this documentation
2. Review console logs (F12 in browser)
3. Verify environment variables are set correctly
4. Test with a clear, well-lit logbook image
5. Try the fallback AI provider

For bugs or feature requests, open an issue on GitHub.
