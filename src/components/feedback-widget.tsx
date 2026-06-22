"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trackFeedbackSubmitted } from "@/lib/events";

const STORAGE_KEY = "selvedge_feedback_shown";

interface FeedbackWidgetProps {
  activationAction: string;
  onClose?: () => void;
}

export function FeedbackWidget({ activationAction, onClose }: FeedbackWidgetProps) {
  const [open, setOpen] = useState(false);
  const [source, setSource] = useState("");
  const [feedback, setFeedback] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Check if already shown
    const shown = localStorage.getItem(STORAGE_KEY);
    if (!shown) {
      // Small delay to not disrupt the activation action
      const timer = setTimeout(() => setOpen(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem(STORAGE_KEY, "true");
    setOpen(false);
    onClose?.();
  };

  const handleSubmit = () => {
    trackFeedbackSubmitted({
      activation_action: activationAction,
      source: source || undefined,
      feedback: feedback || undefined,
    });
    setSubmitted(true);
    setTimeout(() => {
      handleClose();
    }, 1500);
  };

  if (submitted) {
    return (
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-ink">Thank you!</DialogTitle>
            <DialogDescription className="text-soft">
              Your feedback helps us improve Selvedge.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-ink">Quick feedback</DialogTitle>
          <DialogDescription className="text-soft">
            Help us understand how we can improve your experience.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="source" className="font-mono text-xs uppercase tracking-wider text-soft">
              How did you find us?
            </Label>
            <Select value={source} onValueChange={(value) => setSource(value || "")}>
              <SelectTrigger className="bg-bone border-line">
                <SelectValue placeholder="Select an option" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="google">Google Search</SelectItem>
                <SelectItem value="social">Social Media</SelectItem>
                <SelectItem value="friend">Friend / Referral</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="feedback" className="font-mono text-xs uppercase tracking-wider text-soft">
              Any feedback? (optional)
            </Label>
            <Textarea
              id="feedback"
              placeholder="Tell us what you think..."
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              className="bg-bone border-line resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={handleClose}
            className="border-line text-soft hover:bg-bone"
          >
            Skip
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-clay hover:bg-clay-deep text-bone"
          >
            Submit
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
