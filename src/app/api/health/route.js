import { NextResponse } from "next/server";

export const runtime = "nodejs";

// 診斷用端點：只回傳「是否有設定」的布林值和非機密資訊，絕不回傳 NEXON_API_KEY 本身的值。
// 用來確認正式環境的 SSR 執行環境是否真的拿得到 Amplify Console 設定的環境變數。
export async function GET() {
  return NextResponse.json({
    hasNexonApiKey: Boolean(process.env.NEXON_API_KEY),
    nexonApiBaseUrl: process.env.NEXON_API_BASE_URL || "(未設定，將使用預設值)",
    nodeEnv: process.env.NODE_ENV || null,
    awsRegion: process.env.AWS_REGION || null,
    lambdaFunctionName: process.env.AWS_LAMBDA_FUNCTION_NAME || null,
    executionEnv: process.env.AWS_EXECUTION_ENV || null,
  });
}
