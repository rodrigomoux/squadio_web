/** Converte área cropada (react-easy-crop) em data URL JPEG. */
export async function getCroppedImageDataUrl(
  imageSrc: string,
  crop: { x: number; y: number; width: number; height: number },
  options?: { maxWidth?: number; quality?: number },
): Promise<string> {
  const image = await loadImage(imageSrc);
  const maxWidth = options?.maxWidth ?? 1600;
  const quality = options?.quality ?? 0.85;

  const scale = Math.min(1, maxWidth / crop.width);
  const outW = Math.round(crop.width * scale);
  const outH = Math.round(crop.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = outW;
  canvas.height = outH;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas não disponível");

  ctx.drawImage(
    image,
    crop.x,
    crop.y,
    crop.width,
    crop.height,
    0,
    0,
    outW,
    outH,
  );

  return canvas.toDataURL("image/jpeg", quality);
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener("load", () => resolve(img));
    img.addEventListener("error", () =>
      reject(new Error("Não foi possível carregar a imagem")),
    );
    img.crossOrigin = "anonymous";
    img.src = src;
  });
}

export function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.addEventListener("load", () => {
      if (typeof reader.result === "string") resolve(reader.result);
      else reject(new Error("Falha ao ler arquivo"));
    });
    reader.addEventListener("error", () =>
      reject(new Error("Falha ao ler arquivo")),
    );
    reader.readAsDataURL(file);
  });
}
