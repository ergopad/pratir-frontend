import { Box, CircularProgress, Dialog, DialogContent, DialogTitle, Fade, IconButton, Typography } from '@mui/material';
import React, { FC, useEffect, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { trpc } from '@server/utils/trpc';
import BlitzCard from '@components/BlitzCard';
import Grid from '@mui/system/Unstable_Grid/Grid';

interface IViewCardsDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cards: [string, number][];
}

const ViewCardsDialog: FC<IViewCardsDialogProps> = ({ open, setOpen, cards }) => {
  const getTokenData = trpc.api.getPackTokenMetadata.useMutation();
  const [cardMetadata, setCardMetadata] = useState<{
    tokenId: string;
    metadata: IPackInfo;
  }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showVideo, setShowVideo] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const setCards = async () => {
      const metadata = await getTokenData.mutateAsync({ tokenIds: cards.map(card => card[0]) });
      setCardMetadata(metadata);
      setLoading(false);
    };
    if (cards.length) {
      setLoading(true);
      setShowVideo(true); // Show video when component mounts or cards change
      setCards();
    }
  }, [cards]);

  // This useEffect is to ensure video visibility is only controlled by the video's end event
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleVideoEnd = () => setShowVideo(false);
      video.addEventListener('ended', handleVideoEnd);

      // Clean up the event listener on component unmount
      return () => video.removeEventListener('ended', handleVideoEnd);
    }
  }, []);

  console.log(cardMetadata)

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      fullScreen
      aria-labelledby="view-cards-dialog"
      aria-describedby="view-cards"
      sx={{
        p: 0,
        '& .MuiPaper-root': {
          // background: 'none',
          lineHeight: 0,
          // borderRadius: '26px'
        },
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(5px)',
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        }
      }}
    >
      <DialogContent sx={{ p: 0 }}>
        <Fade in={showVideo} unmountOnExit>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height="100%"
            sx={{
              position: 'fixed',
              width: '100vw',
              height: '100vh',
              p: 0,
              m: 0,
              zIndex: 5,
              background: 'black',
              '& video': {
                maxWidth: '100%',
                maxHeight: '100vh',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain'
              }
            }}
            onClick={() => setShowVideo(false)}
          >
            <video ref={videoRef} autoPlay onEnded={() => setShowVideo(false)}>
              <source src="/assets/common_website_render.mp4" type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          </Box>
        </Fade>
        <IconButton
          aria-label="close"
          onClick={() => setOpen(false)}
          sx={{
            position: 'absolute',
            right: 8,
            top: 8,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <Box sx={{ p: 3 }}>
          {loading
            ? <Box>
              <CircularProgress />
            </Box>
            : <Grid container spacing={2} justifyContent="center">
              {cardMetadata.map((card, i) => (
                <Grid xs={12} sm={6} md={4} key={i}>
                  <Box sx={{ maxWidth: '400px', margin: 'auto' }}>
                    <BlitzCard data={card.metadata} />
                  </Box>
                </Grid>
              ))}
            </Grid>
          }
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ViewCardsDialog;