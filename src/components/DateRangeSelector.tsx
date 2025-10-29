"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

// Utility functions for date manipulation
const addDays = (date: Date, days: number): Date => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addWeeks = (date: Date, weeks: number): Date => {
  return addDays(date, weeks * 7);
};

const subWeeks = (date: Date, weeks: number): Date => {
  return addWeeks(date, -weeks);
};

const startOfWeek = (date: Date, weekStartsOn: number = 0): Date => {
  const result = new Date(date);
  const day = result.getDay();
  const diff = (day < weekStartsOn ? 7 : 0) + day - weekStartsOn;
  result.setDate(result.getDate() - diff);
  return result;
};

const endOfWeek = (date: Date, weekStartsOn: number = 0): Date => {
  const result = startOfWeek(date, weekStartsOn);
  result.setDate(result.getDate() + 6);
  return result;
};

const eachDayOfInterval = (interval: { start: Date; end: Date }): Date[] => {
  const days: Date[] = [];
  const current = new Date(interval.start);
  
  while (current <= interval.end) {
    days.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return days;
};

const format = (date: Date, formatStr: string): string => {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  
  const shortMonths = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const shortDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  
  const year = date.getFullYear();
  const month = date.getMonth();
  const day = date.getDate();
  const dayOfWeek = date.getDay();
  
  return formatStr
    .replace("MMMM", months[month])
    .replace("MMM", shortMonths[month])
    .replace("yyyy", year.toString())
    .replace("dd", day.toString().padStart(2, "0"))
    .replace("d", day.toString())
    .replace("EEEE", days[dayOfWeek])
    .replace("EEE", shortDays[dayOfWeek])
    .replace("yyyy-MM-dd", `${year}-${(month + 1).toString().padStart(2, "0")}-${day.toString().padStart(2, "0")}`);
};

const isSameDay = (date1: Date, date2: Date): boolean => {
  return date1.getFullYear() === date2.getFullYear() &&
         date1.getMonth() === date2.getMonth() &&
         date1.getDate() === date2.getDate();
};

// Input component for date inputs
type InputProps = React.InputHTMLAttributes<HTMLInputElement>;

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => {
    return (
      <input
        type={type}
        className={cn(
          "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);

Input.displayName = "Input";

// Main DateRangeSelector component
interface DateRangeSelectorProps {
  onDateRangeChange?: (startDate: Date | null, endDate: Date | null) => void;
  initialStartDate?: Date | null;
  initialEndDate?: Date | null;
  className?: string;
}

const DateRangeSelector: React.FC<DateRangeSelectorProps> = ({
  onDateRangeChange,
  initialStartDate,
  initialEndDate,
  className
}) => {
  const [currentWeek, setCurrentWeek] = useState<Date>(initialStartDate || new Date());
  const [startDate, setStartDate] = useState<Date | null>(initialStartDate || null);
  const [endDate, setEndDate] = useState<Date | null>(initialEndDate || null);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectingMode, setSelectingMode] = useState<'start' | 'end' | null>(null);

  const weekStart = startOfWeek(currentWeek, 0);
  const weekEnd = endOfWeek(currentWeek, 0);
  const weekDays = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const DAYS_OF_WEEK = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  useEffect(() => {
    if (onDateRangeChange) {
      onDateRangeChange(startDate, endDate);
    }
  }, [startDate, endDate, onDateRangeChange]);

  const navigateWeek = (direction: "prev" | "next") => {
    const newWeek = direction === "prev" 
      ? subWeeks(currentWeek, 1) 
      : addWeeks(currentWeek, 1);
    setCurrentWeek(newWeek);
  };

  const handleDateSelect = (date: Date) => {
    if (!startDate || (startDate && endDate)) {
      // Start new selection
      setStartDate(date);
      setEndDate(null);
      setSelectingMode('end');
    } else if (startDate && !endDate) {
      // Complete selection
      if (date >= startDate) {
        setEndDate(date);
      } else {
        // If selected date is before start, swap them
        setEndDate(startDate);
        setStartDate(date);
      }
      setSelectingMode(null);
    }
    setCurrentWeek(date);
  };

  const clearSelection = () => {
    setStartDate(null);
    setEndDate(null);
    setSelectingMode(null);
  };

  const setToday = () => {
    const today = new Date();
    setStartDate(today);
    setEndDate(today);
    setCurrentWeek(today);
    setSelectingMode(null);
  };

  const setThisWeek = () => {
    const today = new Date();
    const weekStart = startOfWeek(today, 0);
    const weekEnd = endOfWeek(today, 0);
    setStartDate(weekStart);
    setEndDate(weekEnd);
    setCurrentWeek(today);
    setSelectingMode(null);
  };

  return (
    <div className={cn("w-full max-w-4xl mx-auto space-y-4 px-2 sm:px-0", className)}>
      {/* Header with navigation and date range display */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between p-3 sm:p-4 bg-card rounded-lg border shadow-sm space-y-3 sm:space-y-0">
        <div className="flex items-center justify-center sm:justify-start space-x-2 sm:space-x-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek("prev")}
            className="h-8 w-8 sm:h-8 sm:w-8"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
          
          <div className="text-center flex-1 sm:flex-none">
            <h2 className="text-base sm:text-lg font-semibold text-card-foreground">
              {startDate && endDate 
                ? `${format(startDate, "MMM d")} - ${format(endDate, "MMM d, yyyy")}`
                : startDate 
                ? `${format(startDate, "MMM d, yyyy")} - Select end date`
                : "Select date range"
              }
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              {selectingMode === 'end' ? 'Tap to select end date' : 'Tap to select start date'}
            </p>
          </div>
          
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigateWeek("next")}
            className="h-8 w-8 sm:h-8 sm:w-8"
          >
            <ChevronRight className="h-3 w-3 sm:h-4 sm:w-4" />
          </Button>
        </div>

        <div className="flex flex-wrap items-center justify-center sm:justify-end gap-2">
          <Button
            variant="outline"
            onClick={setToday}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-auto"
          >
            Today
          </Button>
          
          <Button
            variant="outline"
            onClick={setThisWeek}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-auto"
          >
            This Week
          </Button>
          
          <Button
            variant="outline"
            onClick={clearSelection}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-auto"
          >
            Clear
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setIsCalendarOpen(!isCalendarOpen)}
            className="text-xs sm:text-sm px-2 sm:px-3 py-1 sm:py-2 h-8 sm:h-auto"
          >
            <CalendarIcon className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
            <span className="hidden sm:inline">Jump to Date</span>
            <span className="sm:hidden">Jump</span>
          </Button>
        </div>
      </div>

      {/* Quick date jump calendar */}
      <AnimatePresence>
        {isCalendarOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="p-3 sm:p-4 bg-card rounded-lg border shadow-sm">
              <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-4 mb-4">
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-2 flex-1">
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">Start Date</label>
                    <Input
                      type="date"
                      value={startDate ? format(startDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          const newDate = new Date(e.target.value);
                          setStartDate(newDate);
                          setCurrentWeek(newDate);
                        }
                      }}
                      className="w-full h-10 text-sm"
                    />
                  </div>
                  <div className="flex-1">
                    <label className="text-xs text-muted-foreground block mb-1">End Date</label>
                    <Input
                      type="date"
                      value={endDate ? format(endDate, "yyyy-MM-dd") : ""}
                      onChange={(e) => {
                        if (e.target.value) {
                          const newDate = new Date(e.target.value);
                          setEndDate(newDate);
                          setCurrentWeek(newDate);
                        }
                      }}
                      className="w-full h-10 text-sm"
                    />
                  </div>
                </div>
                <Button
                  onClick={() => setIsCalendarOpen(false)}
                  variant="outline"
                  size="sm"
                  className="self-start sm:self-auto"
                >
                  Close
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Weekly calendar grid */}
      <div className="bg-card rounded-lg border shadow-sm overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {DAYS_OF_WEEK.map((day) => (
            <div
              key={day}
              className="p-2 sm:p-4 text-center text-xs sm:text-sm font-medium text-muted-foreground border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date cells */}
        <div className="grid grid-cols-7">
          {weekDays.map((day) => {
            const isStartDate = startDate && isSameDay(day, startDate);
            const isEndDate = endDate && isSameDay(day, endDate);
            const isInRange = startDate && endDate && day >= startDate && day <= endDate;
            const isToday = isSameDay(day, new Date());

            return (
              <motion.button
                key={day.toString()}
                onClick={() => handleDateSelect(day)}
                className={cn(
                  "p-3 sm:p-6 text-center border-r last:border-r-0 border-b transition-colors relative min-h-[60px] sm:min-h-auto",
                  "hover:bg-accent hover:text-accent-foreground active:bg-accent/80",
                  "touch-manipulation", // Optimizes for touch
                  isStartDate && "bg-primary text-primary-foreground hover:bg-primary/90",
                  isEndDate && "bg-primary text-primary-foreground hover:bg-primary/90",
                  isInRange && !isStartDate && !isEndDate && "bg-primary/20 text-primary",
                  isToday && !isStartDate && !isEndDate && !isInRange && "bg-accent text-accent-foreground font-semibold"
                )}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }} // Better feedback for mobile
              >
                <div className="space-y-1">
                  <div className="text-lg sm:text-2xl font-semibold">
                    {format(day, "d")}
                  </div>
                  <div className="text-xs opacity-70 hidden sm:block">
                    {format(day, "EEE")}
                  </div>
                  {isStartDate && (
                    <div className="text-xs font-medium">Start</div>
                  )}
                  {isEndDate && (
                    <div className="text-xs font-medium">End</div>
                  )}
                </div>
                
                {isToday && (
                  <div className="absolute top-1 sm:top-2 right-1 sm:right-2 w-2 h-2 bg-blue-500 rounded-full" />
                )}
              </motion.button>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default DateRangeSelector;