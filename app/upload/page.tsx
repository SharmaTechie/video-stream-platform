"use client"

import type React from "react"

import { useState, useRef } from "react"
import { useRouter } from "next/navigation"
import { motion } from "framer-motion"
import { z } from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { useToast } from "@/components/ui/use-toast"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Progress } from "@/components/ui/progress"
import { Upload, X, FileVideo } from "lucide-react"
import { useAuth } from "@/hooks/use-auth"
import { uploadVideo } from "@/lib/video-actions"

const formSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }).max(100),
  description: z.string().max(500).optional(),
  visibility: z.enum(["public", "unlisted", "private"]),
})

export default function UploadPage() {
  const { user, status } = useAuth()
  const router = useRouter()
  const { toast } = useToast()
  const [videoFile, setVideoFile] = useState<File | null>(null)
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null)
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const thumbnailInputRef = useRef<HTMLInputElement>(null)

  // Redirect if not logged in
  if (status === "unauthenticated") {
    router.push("/login")
  }

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      description: "",
      visibility: "public",
    },
  })

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type.startsWith("video/")) {
        setVideoFile(file)
      } else {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select a video file",
        })
      }
    }
  }

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type.startsWith("image/")) {
        setThumbnailFile(file)
        const reader = new FileReader()
        reader.onload = (e) => {
          setThumbnailPreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        toast({
          variant: "destructive",
          title: "Invalid file type",
          description: "Please select an image file",
        })
      }
    }
  }

  const clearVideo = () => {
    setVideoFile(null)
    if (videoInputRef.current) {
      videoInputRef.current.value = ""
    }
  }

  const clearThumbnail = () => {
    setThumbnailFile(null)
    setThumbnailPreview(null)
    if (thumbnailInputRef.current) {
      thumbnailInputRef.current.value = ""
    }
  }

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    if (!videoFile) {
      toast({
        variant: "destructive",
        title: "No video selected",
        description: "Please select a video to upload",
      })
      return
    }

    setIsUploading(true)

    try {
      const formData = new FormData()
      formData.append("title", values.title)
      formData.append("description", values.description || "")
      formData.append("visibility", values.visibility)
      formData.append("video", videoFile)

      if (thumbnailFile) {
        formData.append("thumbnail", thumbnailFile)
      }

      const result = await uploadVideo(formData, (progress) => {
        setUploadProgress(progress)
      })

      if (result.success) {
        toast({
          title: "Upload successful",
          description: "Your video has been uploaded and is being processed",
        })
        router.push(`/video/${result.videoId}`)
      } else {
        toast({
          variant: "destructive",
          title: "Upload failed",
          description: result.error || "Something went wrong",
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Upload failed",
        description: "Something went wrong. Please try again.",
      })
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="container mx-auto py-8 max-w-3xl">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-3xl font-bold mb-8">Upload Video</h1>

        <div className="bg-card rounded-lg shadow-lg p-6 mb-8">
          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Select Video</h2>

            {!videoFile ? (
              <div
                className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => videoInputRef.current?.click()}
              >
                <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-lg font-medium">Click to select or drag and drop</p>
                <p className="text-sm text-muted-foreground mt-2">MP4, WebM or MOV (max. 2GB)</p>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept="video/*"
                  className="hidden"
                  onChange={handleVideoChange}
                />
              </div>
            ) : (
              <div className="flex items-center p-4 bg-muted rounded-lg">
                <FileVideo className="h-10 w-10 text-primary mr-4" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{videoFile.name}</p>
                  <p className="text-sm text-muted-foreground">{(videoFile.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
                <Button variant="ghost" size="icon" onClick={clearVideo}>
                  <X className="h-5 w-5" />
                </Button>
              </div>
            )}
          </div>

          <div className="mb-6">
            <h2 className="text-xl font-semibold mb-4">Thumbnail</h2>

            {!thumbnailPreview ? (
              <div
                className="border-2 border-dashed border-muted-foreground/30 rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => thumbnailInputRef.current?.click()}
              >
                <p className="text-lg font-medium">Select thumbnail image</p>
                <p className="text-sm text-muted-foreground mt-2">JPG, PNG or GIF (16:9 recommended)</p>
                <input
                  ref={thumbnailInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleThumbnailChange}
                />
              </div>
            ) : (
              <div className="relative">
                <img
                  src={thumbnailPreview || "/placeholder.svg"}
                  alt="Thumbnail preview"
                  className="w-full h-48 object-cover rounded-lg"
                />
                <Button
                  variant="destructive"
                  size="icon"
                  className="absolute top-2 right-2 rounded-full"
                  onClick={clearThumbnail}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="bg-card rounded-lg shadow-lg p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Video title" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Tell viewers about your video"
                        className="resize-none min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>Briefly describe your video (optional)</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="visibility"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Visibility</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select visibility" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="public">Public</SelectItem>
                        <SelectItem value="unlisted">Unlisted</SelectItem>
                        <SelectItem value="private">Private</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormDescription>Who can see your video</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {isUploading && (
                <div className="space-y-2">
                  <Progress value={uploadProgress} className="h-2" />
                  <p className="text-sm text-muted-foreground text-center">Uploading: {uploadProgress}%</p>
                </div>
              )}

              <div className="flex justify-end gap-4">
                <Button type="button" variant="outline" onClick={() => router.push("/")} disabled={isUploading}>
                  Cancel
                </Button>
                <Button type="submit" disabled={!videoFile || isUploading}>
                  {isUploading ? "Uploading..." : "Upload Video"}
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </motion.div>
    </div>
  )
}

