import { useState, useRef, useCallback } from 'react';
import Webcam from 'react-webcam';
import html2canvas from 'html2canvas';
import { styled } from '@mui/material/styles';
import { Button, Box, Typography, Container, CircularProgress } from '@mui/material';
import CameraAltIcon from '@mui/icons-material/CameraAlt';
import DownloadIcon from '@mui/icons-material/Download';
import ReplayIcon from '@mui/icons-material/Replay';

const bwFilter = 'grayscale(100%) sepia(20%) contrast(110%) brightness(110%)';

const StyledContainer = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  minHeight: '100vh',
  padding: '2rem',
  backgroundColor: '#000000',
  color: '#fff',
});

const WebcamContainer = styled('div')({
  width: '100%',
  height: '100%',
  position: 'absolute',
  top: 0,
  left: 0,
  '& video': {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    transform: 'scaleX(-1)',
    filter: bwFilter,
  }
});

const CameraContainer = styled('div')({
  position: 'relative',
  width: '100%',
  maxWidth: '640px',
  margin: '0 auto',
  aspectRatio: '1/1',
  overflow: 'hidden',
});

const PhotoStrip = styled('div')({
  display: 'flex',
  flexDirection: 'column',
  gap: '16px',
  padding: '32px',
  backgroundColor: '#f5f5f5',
  width: '320px',
  marginTop: '2rem',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.4)',
  '@media print, (min-resolution: 200dpi)': {
    boxShadow: 'none',
    padding: '32px',
    backgroundColor: '#f5f5f5',
    '& img': {
      filter: `${bwFilter} !important`,
    }
  }
});

const PHOTO_SIZE = 256; // Make photos square

const PhotoFrame = styled('div')({
  width: PHOTO_SIZE + 'px',
  height: PHOTO_SIZE + 'px',
  overflow: 'hidden',
  position: 'relative',
  backgroundColor: '#1a1a1a',
  '& img': {
    position: 'absolute',
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    filter: bwFilter,
    transform: 'scaleX(-1)', // Mirror the saved photos too
  }
});

const ActionButton = styled(Button)({
  margin: '0.5rem',
  borderRadius: '2px',
  padding: '12px 32px',
  backgroundColor: '#ffffff',
  color: '#000000',
  textTransform: 'none',
  fontSize: '0.95rem',
  fontWeight: 400,
  letterSpacing: '1px',
  '&:hover': {
    backgroundColor: '#f0f0f0',
  },
  '&.MuiButton-outlined': {
    borderColor: '#ffffff',
    color: '#ffffff',
    backgroundColor: 'transparent',
    '&:hover': {
      backgroundColor: 'rgba(255,255,255,0.1)',
    },
  },
});

const CountdownOverlay = styled(Typography)({
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  color: 'white',
  fontSize: '72px',
  fontWeight: '300',
  zIndex: 2,
});

function App() {
  const webcamRef = useRef(null);
  const [photos, setPhotos] = useState([]);
  const [isCapturing, setIsCapturing] = useState(false);
  const [countdown, setCountdown] = useState(null);

  const capturePhoto = useCallback(() => {
    if (webcamRef.current) {
      const video = webcamRef.current.video;
      const canvas = document.createElement('canvas');
      
      // Set canvas size to match video
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      
      const ctx = canvas.getContext('2d');
      ctx.filter = bwFilter;
      ctx.drawImage(video, 0, 0);
      
      // Create a square crop canvas
      const cropCanvas = document.createElement('canvas');
      const size = Math.min(video.videoWidth, video.videoHeight);
      cropCanvas.width = size;
      cropCanvas.height = size;
      
      const cropCtx = cropCanvas.getContext('2d');
      
      // Center the crop
      const sourceX = (video.videoWidth - size) / 2;
      const sourceY = (video.videoHeight - size) / 2;
      
      // Draw the square crop
      cropCtx.drawImage(canvas,
        sourceX, sourceY, size, size,
        0, 0, size, size
      );
      
      return cropCanvas.toDataURL('image/jpeg', 1.0);
    }
    return null;
  }, [webcamRef]);

  const takePhotos = async () => {
    setIsCapturing(true);
    const newPhotos = [];
    
    for (let i = 0; i < 4; i++) {
      for (let count = 3; count > 0; count--) {
        setCountdown(count);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
      setCountdown('●');
      await new Promise(resolve => setTimeout(resolve, 200));
      const photo = capturePhoto();
      if (photo) {
        newPhotos.push(photo);
      }
      setCountdown(null);
      if (i < 3) await new Promise(resolve => setTimeout(resolve, 800));
    }
    
    setPhotos(newPhotos);
    setIsCapturing(false);
  };

  const downloadPhotoStrip = async () => {
    const stripElement = document.getElementById('photo-strip');
    if (stripElement) {
      const STRIP_WIDTH = 320;
      const PADDING = 32;
      const GAP = 16;
      
      // Get all photos
      const photoElements = stripElement.getElementsByTagName('img');
      
      // Calculate dimensions
      const totalHeight = (PHOTO_SIZE * 4) + (GAP * 3) + (PADDING * 2);
      
      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = STRIP_WIDTH * 2; // 2x for better quality
      canvas.height = totalHeight * 2;
      const ctx = canvas.getContext('2d');
      
      // Fill background
      ctx.fillStyle = '#f5f5f5';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      // Draw each photo
      for (let i = 0; i < photoElements.length; i++) {
        const y = (PADDING + (i * (PHOTO_SIZE + GAP))) * 2;
        
        // Create a temporary canvas for the photo
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = PHOTO_SIZE * 2;
        tempCanvas.height = PHOTO_SIZE * 2;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Draw and process the photo
        tempCtx.filter = bwFilter;
        tempCtx.scale(-1, 1); // Mirror
        tempCtx.translate(-PHOTO_SIZE * 2, 0);
        tempCtx.drawImage(photoElements[i], 0, 0, PHOTO_SIZE * 2, PHOTO_SIZE * 2);
        
        // Draw the processed photo onto main canvas
        ctx.drawImage(
          tempCanvas,
          ((STRIP_WIDTH - PHOTO_SIZE) / 2) * 2,
          y,
          PHOTO_SIZE * 2,
          PHOTO_SIZE * 2
        );
      }
      
      const link = document.createElement('a');
      link.download = 'photo-strip.png';
      link.href = canvas.toDataURL('image/png', 1.0);
      link.click();
    }
  };

  const resetPhotos = () => {
    setPhotos([]);
  };

  const videoConstraints = {
    width: { min: 1280, ideal: 1920 },
    height: { min: 720, ideal: 1080 },
    facingMode: 'user',
  };

  return (
    <StyledContainer>
      <Typography 
        variant="h4" 
        sx={{
          fontWeight: 300,
          letterSpacing: '4px',
          marginBottom: '3rem',
          opacity: 0.9
        }}
      >
        PHOTO BOOTH
      </Typography>

      {photos.length === 0 ? (
        <CameraContainer>
          <WebcamContainer>
            <Webcam
              ref={webcamRef}
              audio={false}
              screenshotFormat="image/jpeg"
              videoConstraints={videoConstraints}
            />
          </WebcamContainer>
          {countdown && (
            <CountdownOverlay>
              {countdown}
            </CountdownOverlay>
          )}
          <Box sx={{ position: 'absolute', bottom: '24px', left: '50%', transform: 'translateX(-50%)' }}>
            <ActionButton
              variant="contained"
              onClick={takePhotos}
              disabled={isCapturing}
              startIcon={isCapturing ? <CircularProgress size={20} color="inherit" /> : <CameraAltIcon />}
            >
              {isCapturing ? 'Capturing...' : 'Take Photos'}
            </ActionButton>
          </Box>
        </CameraContainer>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <PhotoStrip id="photo-strip">
            {photos.map((photo, index) => (
              <PhotoFrame key={index}>
                <img src={photo} alt={`Photo ${index + 1}`} />
              </PhotoFrame>
            ))}
          </PhotoStrip>
          
          <Box sx={{ mt: 3, display: 'flex', gap: 2 }}>
            <ActionButton
              variant="contained"
              onClick={downloadPhotoStrip}
              startIcon={<DownloadIcon />}
            >
              Download
            </ActionButton>
            <ActionButton
              variant="outlined"
              onClick={resetPhotos}
              startIcon={<ReplayIcon />}
            >
              Try Again
            </ActionButton>
          </Box>
        </Box>
      )}
    </StyledContainer>
  );
}

export default App;
