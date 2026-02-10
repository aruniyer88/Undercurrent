"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trash2, ImageIcon, Link, Video, Upload } from "lucide-react";
import { Stimulus, StimulusType } from "@/lib/types/study-flow";
import { cn } from "@/lib/utils";

interface StimulusEditorProps {
  stimulus?: Stimulus;
  onChange: (stimulus: Stimulus | undefined) => void;
  onRemove: () => void;
}

export function StimulusEditor({
  stimulus,
  onChange,
  onRemove,
}: StimulusEditorProps) {
  const [activeTab, setActiveTab] = useState<StimulusType>(
    stimulus?.type || "image"
  );
  const [imagePreview, setImagePreview] = useState<string | null>(
    stimulus?.type === "image" ? stimulus.url : null
  );

  const handleTabChange = (value: string) => {
    setActiveTab(value as StimulusType);
    // Reset stimulus when switching tabs
    onChange(undefined);
    setImagePreview(null);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type and size
    const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!validTypes.includes(file.type)) {
      alert("Please upload a valid image file (JPG, PNG, GIF, or WebP)");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert("Image must be less than 10MB");
      return;
    }

    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setImagePreview(previewUrl);

    // For now, store as data URL (in production, upload to Supabase Storage)
    const reader = new FileReader();
    reader.onload = () => {
      onChange({
        type: "image",
        url: reader.result as string,
      });
    };
    reader.readAsDataURL(file);
  };

  const handleWebsiteChange = (field: "url" | "instructions", value: string) => {
    onChange({
      type: "website",
      url: field === "url" ? value : (stimulus as { url: string })?.url || "",
      instructions:
        field === "instructions"
          ? value
          : (stimulus as { instructions?: string })?.instructions,
    });
  };

  const handleYouTubeChange = (field: "url" | "instructions", value: string) => {
    onChange({
      type: "youtube",
      url: field === "url" ? value : (stimulus as { url: string })?.url || "",
      instructions:
        field === "instructions"
          ? value
          : (stimulus as { instructions?: string })?.instructions,
    });
  };

  const isValidYouTubeUrl = (url: string): boolean => {
    const patterns = [
      /^https?:\/\/(www\.)?youtube\.com\/watch\?v=[\w-]+/,
      /^https?:\/\/youtu\.be\/[\w-]+/,
      /^https?:\/\/(www\.)?youtube\.com\/embed\/[\w-]+/,
    ];
    return patterns.some((pattern) => pattern.test(url));
  };

  const isValidHttpsUrl = (url: string): boolean => {
    try {
      const parsed = new URL(url);
      return parsed.protocol === "https:";
    } catch {
      return false;
    }
  };

  return (
    <div className="space-y-3 p-4 bg-surface-alt rounded-lg border border-border-subtle">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Section Media</Label>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          className="text-text-muted hover:text-danger-600 h-auto p-1"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="image" className="gap-1.5">
            <ImageIcon className="w-4 h-4" />
            Image
          </TabsTrigger>
          <TabsTrigger value="website" className="gap-1.5">
            <Link className="w-4 h-4" />
            Website
          </TabsTrigger>
          <TabsTrigger value="youtube" className="gap-1.5">
            <Video className="w-4 h-4" />
            YouTube
          </TabsTrigger>
        </TabsList>

        {/* Image Upload */}
        <TabsContent value="image" className="space-y-3">
          {imagePreview ? (
            <div className="space-y-2">
              <div className="relative aspect-video rounded-md overflow-hidden bg-surface">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imagePreview}
                  alt="Media preview"
                  className="w-full h-full object-contain"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setImagePreview(null);
                  onChange(undefined);
                }}
              >
                Remove Image
              </Button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border-subtle rounded-lg cursor-pointer hover:bg-surface transition-colors">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="w-8 h-8 text-text-muted mb-2" />
                <p className="text-sm text-text-muted">
                  <span className="font-semibold">Click to upload</span> or drag
                  and drop
                </p>
                <p className="text-xs text-text-muted">
                  PNG, JPG, GIF, WebP (max 10MB)
                </p>
              </div>
              <input
                type="file"
                className="hidden"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleImageUpload}
              />
            </label>
          )}
          <Input
            placeholder="Optional caption for the image"
            value={(stimulus as { caption?: string })?.caption || ""}
            onChange={(e) =>
              onChange({
                type: "image",
                url: (stimulus as { url: string })?.url || "",
                caption: e.target.value,
              })
            }
          />
        </TabsContent>

        {/* Website Link */}
        <TabsContent value="website" className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="website-url">Website URL</Label>
            <Input
              id="website-url"
              type="url"
              placeholder="https://example.com"
              value={stimulus?.type === "website" ? stimulus.url : ""}
              onChange={(e) => handleWebsiteChange("url", e.target.value)}
              className={cn(
                stimulus?.type === "website" &&
                  stimulus.url &&
                  !isValidHttpsUrl(stimulus.url) &&
                  "border-danger-600"
              )}
            />
            {stimulus?.type === "website" &&
              stimulus.url &&
              !isValidHttpsUrl(stimulus.url) && (
                <p className="text-caption text-danger-600">
                  Please enter a valid HTTPS URL
                </p>
              )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="website-instructions">Instructions (optional)</Label>
            <Textarea
              id="website-instructions"
              placeholder="Tell participants what to look for on this website..."
              value={
                stimulus?.type === "website" ? stimulus.instructions || "" : ""
              }
              onChange={(e) =>
                handleWebsiteChange("instructions", e.target.value)
              }
            />
          </div>
        </TabsContent>

        {/* YouTube Video */}
        <TabsContent value="youtube" className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="youtube-url">YouTube URL</Label>
            <Input
              id="youtube-url"
              type="url"
              placeholder="https://www.youtube.com/watch?v=..."
              value={stimulus?.type === "youtube" ? stimulus.url : ""}
              onChange={(e) => handleYouTubeChange("url", e.target.value)}
              className={cn(
                stimulus?.type === "youtube" &&
                  stimulus.url &&
                  !isValidYouTubeUrl(stimulus.url) &&
                  "border-danger-600"
              )}
            />
            {stimulus?.type === "youtube" &&
              stimulus.url &&
              !isValidYouTubeUrl(stimulus.url) && (
                <p className="text-caption text-danger-600">
                  Please enter a valid YouTube URL
                </p>
              )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="youtube-instructions">Instructions (optional)</Label>
            <Textarea
              id="youtube-instructions"
              placeholder="Tell participants what to pay attention to in the video..."
              value={
                stimulus?.type === "youtube" ? stimulus.instructions || "" : ""
              }
              onChange={(e) =>
                handleYouTubeChange("instructions", e.target.value)
              }
            />
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
