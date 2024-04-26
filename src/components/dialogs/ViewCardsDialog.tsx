import { Box, CircularProgress, Dialog, DialogContent, DialogTitle, Fade, IconButton, Typography, useTheme } from '@mui/material';
import React, { FC, useEffect, useRef, useState } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { trpc } from '@server/utils/trpc';
import BlitzCard from '@components/BlitzCard';
import Grid from '@mui/system/Unstable_Grid/Grid';

interface IViewCardsDialogProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  cards: [string, number][];
  packType?: "common" | "uncommon" | "rare";
}

const ViewCardsDialog: FC<IViewCardsDialogProps> = ({ open, setOpen, cards, packType }) => {
  const theme = useTheme()
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

  const [videoSourceFile, setVideoSourceFile] = useState("/assets/common_website_render.mp4")

  // This useEffect is to ensure video visibility is only controlled by the video's end event
  useEffect(() => {
    if (packType === "common") setVideoSourceFile("/assets/common_website_render.mp4")
    if (packType === "uncommon") setVideoSourceFile("/assets/uncommon_website_render.mp4")
    if (packType === "rare") setVideoSourceFile("/assets/rare_website_render.mp4")
    const video = videoRef.current;
    if (video) {
      const handleVideoEnd = () => setShowVideo(false);
      video.addEventListener('ended', handleVideoEnd);

      // Clean up the event listener on component unmount
      return () => video.removeEventListener('ended', handleVideoEnd);
    }
  }, [packType]);

  return (
    <Dialog
      open={open}
      onClose={() => setOpen(false)}
      maxWidth={false}
      aria-labelledby="view-cards-dialog"
      aria-describedby="view-cards"
      sx={{
        '& .MuiPaper-root': {
          // background: 'none',
          lineHeight: 0,
          // borderRadius: '26px'
          width: '100vw',
          maxWidth: '2400px',
          height: '100%',
          p: '3px'
        },
        '& .MuiBackdrop-root': {
          backdropFilter: 'blur(5px)',
          backgroundColor: 'rgba(0, 0, 0, 0.5)'
        },
        mt: '102px'
      }}
    >
      <DialogContent sx={{
        p: 0,
        maxWidth: '2400px',
        '@media (min-width: 1536px)': {
          display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'
        }
      }}>
        <Fade in={showVideo} unmountOnExit>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            sx={{
              position: 'absolute',
              width: 'calc(100% - 6px)',
              height: 'calc(100% - 6px)',
              p: 0,
              m: 0,
              left: '3px',
              top: '3px',
              zIndex: 11,
              overflow: 'none',
              background: 'black',
              '& video': {
                maxWidth: '100%',
                maxHeight: '100%',
                width: 'auto',
                height: 'auto',
                objectFit: 'contain'
              }
            }}
            onClick={() => setShowVideo(false)}
          >
            <video ref={videoRef} autoPlay onEnded={() => setShowVideo(false)}>
              <source src={videoSourceFile} type="video/mp4" />
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
        <Box sx={{
          p: 3, width: '100%'
          // '@media (min-width: 1536px)': {
          //   display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%'
          // }
        }}>
          {loading
            ? <Box>
              <CircularProgress />
            </Box>
            : <Grid container spacing={2} justifyContent="center">
              {cardMetadata.map((card, i) => (
                <Grid xs={12} sm={6} md={4} xl key={i}>
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