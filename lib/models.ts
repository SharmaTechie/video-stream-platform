import mongoose, { Schema, type Document, type Model } from "mongoose"

// User Interface
interface IUser extends Document {
  username: string
  email: string
  password: string
  profilePicture?: string
  bio?: string
  subscribers?: number
  createdAt: Date
}

// Video Interface
interface IVideo extends Document {
  title: string
  description?: string
  user: mongoose.Types.ObjectId | IUser
  fileId: mongoose.Types.ObjectId
  thumbnailId?: mongoose.Types.ObjectId
  duration: number
  resolutions?: {
    "360p"?: mongoose.Types.ObjectId
    "720p"?: mongoose.Types.ObjectId
    "1080p"?: mongoose.Types.ObjectId
  }
  views: number
  likes: number
  visibility: "public" | "unlisted" | "private"
  createdAt: Date
}

// Comment Interface
interface IComment extends Document {
  text: string
  user: mongoose.Types.ObjectId | IUser
  video: mongoose.Types.ObjectId | IVideo
  likes: number
  createdAt: Date
}

// User Schema
const UserSchema = new Schema<IUser>({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  profilePicture: { type: String },
  bio: { type: String },
  subscribers: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
})

// Video Schema
const VideoSchema = new Schema<IVideo>({
  title: { type: String, required: true },
  description: { type: String },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  fileId: { type: Schema.Types.ObjectId, required: true },
  thumbnailId: { type: Schema.Types.ObjectId },
  duration: { type: Number, default: 0 },
  resolutions: {
    "360p": { type: Schema.Types.ObjectId },
    "720p": { type: Schema.Types.ObjectId },
    "1080p": { type: Schema.Types.ObjectId },
  },
  views: { type: Number, default: 0 },
  likes: { type: Number, default: 0 },
  visibility: {
    type: String,
    enum: ["public", "unlisted", "private"],
    default: "public",
  },
  createdAt: { type: Date, default: Date.now },
})

// Comment Schema
const CommentSchema = new Schema<IComment>({
  text: { type: String, required: true },
  user: { type: Schema.Types.ObjectId, ref: "User", required: true },
  video: { type: Schema.Types.ObjectId, ref: "Video", required: true },
  likes: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
})

// Create or get models
export const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema)
export const Video: Model<IVideo> = mongoose.models.Video || mongoose.model<IVideo>("Video", VideoSchema)
export const Comment: Model<IComment> = mongoose.models.Comment || mongoose.model<IComment>("Comment", CommentSchema)

