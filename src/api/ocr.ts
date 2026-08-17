import { apiUrl } from "./client";

export type NativeUploadFile = {
  uri: string;
  name: string;
  mimeType?: string | null;
};

export type OcrResponse = {
  text?: string;
  ocrText?: string;
  studyText?: string;
  error?: string;
};

export type OcrResult = {
  ocrText: string;
  studyText: string;
};

function toTesseractLang(language: string): string {
  return language === "Chinese" ? "chi_sim" : "eng";
}

export async function uploadFilesForOcr(
  files: NativeUploadFile[],
  language = "English",
): Promise<OcrResult> {
  if (files.length === 0) return { ocrText: "", studyText: "" };

  const form = new FormData();
  for (const file of files) {
    form.append("files", {
      uri: file.uri,
      name: file.name,
      type: file.mimeType || "application/octet-stream",
    } as unknown as Blob);
  }
  form.append("tesseractLang", toTesseractLang(language));
  form.append("language", language);

  const response = await fetch(apiUrl("/api/ocr"), {
    method: "POST",
    body: form,
  });
  const data = (await response.json().catch(() => ({}))) as OcrResponse;

  if (!response.ok) {
    throw new Error(data.error || `OCR failed: ${response.status}`);
  }

  return {
    ocrText: data.ocrText || "",
    studyText: data.studyText || data.text || "",
  };
}
