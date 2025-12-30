
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function analyzeScenario(file: File | null, context: string) {
  let imageBase64 = null;
  if (file) {
    imageBase64 = await new Promise<string>((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve((reader.result as string).split(',')[1]);
      reader.readAsDataURL(file);
    });
  }

  const res = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, promptContext: context })
  });
  return await res.json();
}

export async function generateAdvisoryText(incident: any) {
  const res = await fetch(`${API_URL}/api/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ 
      promptContext: `Generate a short public safety tweet for: ${incident.description}. Risk: ${incident.riskLevel}`,
      taskType: 'ADVISORY' 
    })
  });
  const data = await res.json();
  return data.description || data.text || "Attention: Please remain calm and follow staff instructions.";
}