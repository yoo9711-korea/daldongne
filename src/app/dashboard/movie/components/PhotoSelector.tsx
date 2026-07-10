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
      <p className="dash-card__label">영상에 담을 사진 선택</p>

      <h2
        style={{
          margin: '8px 0 10px',
          fontFamily: 'Noto Serif KR, serif',
          fontSize: 28,
          lineHeight: 1.35,
          color: 'var(--ink)',
        }}
      >
        추억 영상에 담을 사진을 골라주세요.
      </h2>

      <p
        style={{
          color: 'var(--ink-soft)',
          fontSize: 16,
          lineHeight: 1.7,
          marginTop: 0,
          marginBottom: 20,
        }}
      >
        짧은 추억 영상은 사진 1~2장으로 시작할 수 있습니다. 사진을 선택하면
        사진 속 이야기를 먼저 정리합니다.
      </p>

      {photos.length === 0 ? (
        <div
          style={{
            padding: 24,
            borderRadius: 18,
            background: 'var(--paper-shade)',
            color: 'var(--ink-soft)',
            fontSize: 16,
            lineHeight: 1.7,
          }}
        >
          아직 올린 사진이 없습니다. 먼저 <strong>사진 모으기</strong>에서 부모님
          사진이나 가족사진을 올려주세요.
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill,minmax(170px,1fr))',
            gap: 18,
            marginTop: 20,
          }}
        >
          {photos.map((photo) => (
            <div
              key={photo.id}
              onClick={() => {
                togglePhoto(photo.url);
                analyzePhoto(photo.url);
              }}
              style={{
                aspectRatio: '4 / 3',
                overflow: 'hidden',
                borderRadius: 14,
                cursor: 'pointer',
                position: 'relative',

                border: selectedPhotos.includes(photo.url)
                  ? '3px solid var(--gold)'
                  : '2px solid transparent',

                boxShadow: selectedPhotos.includes(photo.url)
                  ? '0 8px 24px rgba(182,137,47,.25)'
                  : '0 2px 8px rgba(0,0,0,.08)',

                transform: selectedPhotos.includes(photo.url)
                  ? 'scale(1.03)'
                  : 'scale(1)',

                transition: '.25s',
              }}
            >
              <img
                src={photo.url}
                alt={photo.title || '추억 영상에 담을 사진'}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />

              {selectedPhotos.includes(photo.url) && (
                <div
                  style={{
                    position: 'absolute',
                    top: 8,
                    right: 8,
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'var(--gold)',
                    color: '#fff',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    fontWeight: 800,
                  }}
                >
                  {selectedPhotos.indexOf(photo.url) + 1}
                </div>
              )}

              <div
                style={{
                  position: 'absolute',
                  left: 8,
                  bottom: 8,
                  right: 8,
                  padding: '7px 9px',
                  borderRadius: 10,
                  background: 'rgba(26, 22, 17, 0.62)',
                  color: 'var(--cream)',
                  fontSize: 13,
                  lineHeight: 1.4,
                  fontWeight: 700,
                }}
              >
                {selectedPhotos.includes(photo.url)
                  ? '선택됨'
                  : '사진 속 이야기 정리'}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}