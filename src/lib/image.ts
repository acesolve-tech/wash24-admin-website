type CompressOptions = {
    maxSize?: number;
    quality?: number;
};

const loadImage = (src: string) =>
    new Promise<HTMLImageElement>((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = () => reject(new Error("Gambar tidak bisa dibaca."));
        img.src = src; 
    });

export async function compressImage(
    source: Blob | string,
    { maxSize = 1600, quality = 0.8 }: CompressOptions = {}
): Promise<string> {
    const objectUrl = typeof source === "string" ? null : URL.createObjectURL(source);

    try {
        const img = await loadImage(objectUrl ?? (source as string));
        if (!img.naturalWidth || !img.naturalHeight) {
            throw new Error("Ukuran gambar tidak valid.");
        }

        const scale = Math.min(
            1,
            maxSize / Math.max(img.naturalWidth, img.naturalHeight)
        );
        const width = Math.round(img.naturalWidth * scale);
        const height = Math.round(img.naturalHeight * scale);

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const context = canvas.getContext("2d");
        if (!context) throw new Error("Canvas tidak tersedia.");

        context.fillStyle = "#ffffff";
        context.fillRect(0, 0, width, height);
        context.drawImage(img, 0, 0, width, height);

        return canvas.toDataURL("image/jpeg", quality);
    } finally {
        if (objectUrl) URL.revokeObjectURL(objectUrl);
    }
}