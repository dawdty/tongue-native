import * as DocumentPicker from 'expo-document-picker';
import { StatusBar } from "expo-status-bar";
import { useState } from "react";
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { uploadFilesForOcr } from "./src/api/ocr";
import { useRealtimeVoice } from "./src/voice/useRealtimeVoice";

export default function App() {
  const [language, setLanguage] = useState("English");
  const [scenario, setScenario] = useState("");
  const [documentsText, setDocumentsText] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const voice = useRealtimeVoice();

  async function pickDocuments() {
    setError(null);
    const result = await DocumentPicker.getDocumentAsync({
      type: ["application/pdf", "image/*"],
      multiple: true,
      copyToCacheDirectory: true,
    });

    if (result.canceled) return;

    setIsUploading(true);
    try {
      const files = result.assets.map((asset) => ({
        uri: asset.uri,
        name: asset.name,
        mimeType: asset.mimeType,
      }));
      const ocr = await uploadFilesForOcr(files, language);
      setDocumentsText(ocr.studyText || ocr.ocrText);
    } catch (uploadError) {
      setError(uploadError instanceof Error ? uploadError.message : String(uploadError));
    } finally {
      setIsUploading(false);
    }
  }

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>通 - Tongue</Text>
      <Text style={styles.label}>Language</Text>
      <TextInput style={styles.input} value={language} onChangeText={setLanguage} />
      <Text style={styles.label}>Scenario</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={scenario}
        onChangeText={setScenario}
        placeholder="Type your scenario here..."
        multiline
      />
      <Pressable style={styles.button} onPress={pickDocuments} disabled={isUploading}>
        <Text style={styles.buttonText}>{isUploading ? "Scanning..." : "Upload PDFs or images"}</Text>
      </Pressable>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      <Text style={styles.label}>Extracted vocabulary</Text>
      <Text style={styles.output}>{documentsText || "No document uploaded yet."}</Text>
      {voice.roleplayScenario ? (
        <>
          <Text style={styles.label}>Generated roleplay</Text>
          <Text style={styles.output}>{voice.roleplayScenario}</Text>
        </>
      ) : null}
      {voice.error ? <Text style={styles.error}>{voice.error}</Text> : null}
      <Pressable
        style={[styles.button, voice.status === "connected" && styles.disabledButton]}
        disabled={voice.status === "starting" || voice.status === "connected"}
        onPress={() => voice.startVoice({ language, scenario, documentsText })}
      >
        <Text style={styles.buttonText}>
          {voice.status === "starting" ? "Connecting..." : voice.status === "connected" ? "Connected" : "Start voice"}
        </Text>
      </Pressable>
      <Pressable
        style={[styles.button, styles.secondary]}
        disabled={voice.status === "idle"}
        onPress={voice.stopVoice}
      >
        <Text style={styles.buttonText}>Stop voice</Text>
      </Pressable>
      <StatusBar style="auto" />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8fafc",
    padding: 24,
    paddingTop: 72,
    gap: 12,
  },
  title: { fontSize: 28, fontWeight: "700", marginBottom: 16, textAlign: "center" },
  label: { fontSize: 14, fontWeight: "600", color: "#334155" },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#cbd5e1",
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 12,
    fontSize: 16,
  },
  multiline: { minHeight: 88, textAlignVertical: "top" },
  button: {
    width: "100%",
    alignItems: "center",
    backgroundColor: "#0f172a",
    borderRadius: 12,
    padding: 14,
    marginTop: 8,
  },
  secondary: { backgroundColor: "#64748b" },
  disabledButton: { backgroundColor: "#475569" },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "600" },
  error: { color: "#dc2626", width: "100%" },
  output: {
    width: "100%",
    minHeight: 120,
    borderRadius: 12,
    backgroundColor: "#fff",
    padding: 12,
    color: "#334155",
  },
});
