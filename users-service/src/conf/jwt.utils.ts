import mongoose from "mongoose";

const refreshTokenSchema = new mongoose.Schema({
  token: { type: String, required: true, unique: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  expiresAt: { type: Date, required: true },
});

const RefreshToken = mongoose.model("RefreshToken", refreshTokenSchema);

export async function saveRefreshTokenMongo(
  token: string,
  userId: string,
  expiresInSeconds: number
) {
  const expiresAt = new Date(Date.now() + expiresInSeconds * 1000);
  await RefreshToken.create({ token, userId, expiresAt });
}

export async function isRefreshTokenValidMongo(token: string) {
  const tokenDoc = await RefreshToken.findOne({
    token,
    expiresAt: { $gt: new Date() },
  });
  return !!tokenDoc;
}

export async function revokeRefreshTokenMongo(token: string) {
  await RefreshToken.deleteOne({ token });
}
