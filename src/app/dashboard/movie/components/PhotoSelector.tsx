'use client';

type Photo = {
  id: string;
  url: string;
  title: string;
};

type Props = {
  photos: Photo[];
  selectedPhotos: string[];
  togglePhoto: (url: string) => void;
  analyzePhoto: (url: string) => void;
};

export default function PhotoSelector({
  photos,
  selectedPhotos,
  togglePhoto,
  analyzePhoto,
}: Props) {
  return (
    <div className="dash-card">

      <p className="dash-card__label">
        📸 사진 선택 (3~10장)
      </p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fill,minmax(170px,1fr))",
          gap: 18,
          marginTop: 20,
        }}
      >
        {photos.map((p) => (
          <div
            key={p.id}
            onClick={() => {
              togglePhoto(p.url);
              analyzePhoto(p.url);
            }}
            style={{
              aspectRatio: "4 / 3",
              overflow: "hidden",
              borderRadius: 12,
              cursor: "pointer",
              position: "relative",

              border: selectedPhotos.includes(p.url)
                ? "3px solid var(--gold)"
                : "2px solid transparent",

              boxShadow: selectedPhotos.includes(p.url)
                ? "0 8px 24px rgba(182,137,47,.25)"
                : "0 2px 8px rgba(0,0,0,.08)",

              transform: selectedPhotos.includes(p.url)
                ? "scale(1.03)"
                : "scale(1)",

              transition: ".25s",
            }}
          >
            <img
              src={p.url}
              alt={p.title}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
              }}
            />

            {selectedPhotos.includes(p.url) && (
              <div
                style={{
                  position: "absolute",
                  top: 8,
                  right: 8,
                  width: 26,
                  height: 26,
                  borderRadius: "50%",
                  background: "var(--gold)",
                  color: "#fff",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontWeight: 700,
                }}
              >
                {selectedPhotos.indexOf(p.url) + 1}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}