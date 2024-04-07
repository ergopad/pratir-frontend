import { useAlert } from '@contexts/AlertContext';
import { WalletContext } from '@contexts/WalletContext';
import { trpc } from '@server/utils/trpc';
import React, { FC, useContext, useEffect, useState } from 'react';
import { getErgoWalletContext } from './wallet/AddWallet';
import { Box, CircularProgress, Typography, Collapse, IconButton, Button } from '@mui/material';
import TaskAltIcon from '@mui/icons-material/TaskAlt';
import CancelOutlinedIcon from '@mui/icons-material/CancelOutlined';
import Link from '@components/Link';
import QRCode from 'react-qr-code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

interface IProcessTransactionProps {
  order?: IOrder;
}

const ProcessTransaction: FC<IProcessTransactionProps> = ({
  order
}) => {
  const {
    walletAddress,
    dAppWallet
  } = useContext(WalletContext);
  const [submitting, setSubmitting] = useState<TSubmitting>(undefined)
  const { addAlert } = useAlert();
  const [link, setLink] = useState<string>('')
  const [successTx, setSuccessTx] = useState<string | undefined>(undefined)

  // CHECK MOBILE TRANSACTION STUFF
  const [scanned, setScanned] = useState(false);
  const [stopPolling, setStopPolling] = useState(false);
  const [verificationId, setVerificationId] = useState('')
  const [transactionId, setTransactionId] = useState<string>('')
  ////////////////////////////////

  const transactionApi = trpc.api.post.useMutation()
  const getTransaction = async (order: IOrder) => {
    try {
      const res = await transactionApi.mutateAsync({ url: `/order`, body: order });
      return res
    } catch (e: any) {
      throw e;
    }
  };

  const mobileTransaction = trpc.transaction.addMobileResponse.useMutation()

  useEffect(() => {
    const submitTransaction = async () => {
      if (!order || submitting !== undefined) return;

      if (order && submitting === undefined) {
        setSubmitting('submitting');
        try {
          const tx = await getTransaction(order);
          // console.log(tx)
          if (tx) {
            if (dAppWallet.connected) {
              // console.log('once')
              const context = await getErgoWalletContext();
              const signedtx = await context.sign_tx(tx.unsigned.unsignedTransaction);
              const ok = await context.submit_tx(signedtx);
              addAlert('success', `Submitted Transaction: ${ok}`);
              setSuccessTx(ok)
              setSubmitting('success')
            } else {
              const data = {
                reducedTransaction: tx.unsigned.reducedTransaction,
                unsignedTransaction: JSON.stringify(tx.unsigned.unsignedTransaction),
                address: walletAddress
              }
              // console.log(data)
              const verification = await mobileTransaction.mutateAsync(data);
              if (verification) {
                setVerificationId(verification.verificationId)
                setTransactionId(verification.txId)
                const baseUrl = `${window.location.host}`;
                const ergopayDomain = `ergopay://${baseUrl}`;
                const ergopayLink = `${ergopayDomain}/api/ergo-mobile/transaction?verificationId=${verification.verificationId}`
                setLink(ergopayLink)
                setSubmitting('ergopay')
              } else throw Error
            }
          }
          else {
            addAlert('error', 'Not built correctly');
            setSubmitting('failed')
          }
        } catch (e: any) {
          console.error(e);
          if (e.info) {
            addAlert('error', e.info);
          } else if (e.message) {
            addAlert('error', e.message);
          } else {
            addAlert('error', 'An unexpected error occurred');
          }
          setSubmitting('failed')
        }
      }
    }

    submitTransaction()
  }, [order, submitting])

  /////////////// POLLING QR CODE SCAN //////////////////////////////////////////

  const pollScan = trpc.transaction.checkMobileScan.useQuery({
    verificationId
  }, {
    enabled: false
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (scanned) {
        clearInterval(intervalId);
      } else {
        pollScan.refetch();
      }
    }, 5000);

    return () => clearInterval(intervalId);
  }, [scanned, verificationId]);

  useEffect(() => {
    if (pollScan.data === "scanned") {
      setScanned(true)
    }
  }, [pollScan.data]);

  /////////////////////////////////////////////////////////////////////////////



  /////////////// POLLING MOBILE TRANSACTION ////////////////////////////////////

  const pollComplete = trpc.transaction.checkMobileSuccess.useQuery({
    transactionId
  }, {
    enabled: false
  });

  useEffect(() => {
    const intervalId = setInterval(() => {
      if (stopPolling) {
        clearInterval(intervalId);
      } else {
        pollComplete.refetch();
      }
    }, 2000);

    return () => clearInterval(intervalId);
  }, [stopPolling, scanned]);

  useEffect(() => {
    if (pollComplete.data !== null && pollComplete.data >= 0) {
      setSubmitting('success')
      setSuccessTx(transactionId)
      addAlert('success', `Submitted Transaction: ${transactionId}`);

      setStopPolling(true);
    }
  }, [pollComplete.data]);

  /////////////////////////////////////////////////////////////////////////////

  const copyToClipboard = (link: string) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(link).then(() => {
        addAlert('success', 'Link copied to clipboard!');
      }).catch(err => {
        addAlert('error', `Failed to copy link: ${err}`);
      });
    } else {
      // Fallback using document.execCommand (less reliable and secure)
      try {
        const textarea = document.createElement('textarea');
        textarea.value = link;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        addAlert('success', 'Link copied to clipboard!');
      } catch (err) {
        addAlert('error', `Failed to copy link: ${err}`);
      }
    }
  };

  return (
    <>
      <Collapse in={submitting === 'submitting'}>
        <Box
          sx={{
            textAlign: 'center',
          }}
        >
          <CircularProgress size={120} thickness={1} sx={{ mb: '12px' }} />
          <Typography
            sx={{
              fontWeight: '600',
              mb: '12px'
            }}
          >
            Awaiting your confirmation of the transaction.
          </Typography>
        </Box>
      </Collapse>

      <Collapse in={submitting === 'success'}>
        <Box
          sx={{
            textAlign: 'center',
            width: '100%'
          }}
        >
          <TaskAltIcon sx={{ fontSize: '120px' }} />
          <Typography
            sx={{
              fontWeight: '600',
              mb: '12px'
            }}
          >
            Transaction submitted.
          </Typography>
          <Typography>
            View on explorer:
          </Typography>
          <Box sx={{
            overflow: 'hidden',
            whiteSpace: 'nowrap',
            textOverflow: 'ellipsis',
          }}>
            <Link href={'https://explorer.ergoplatform.com/en/transactions/' + successTx}>
              {successTx}
            </Link>
          </Box>
        </Box>
      </Collapse>
      <Collapse in={submitting === 'ergopay'}>
        <Collapse in={!scanned}>
          <Box sx={{ mb: 2 }}>
            <Typography>
              Scan the QR code or follow <Link href={link}>this link</Link>
              <IconButton onClick={() => copyToClipboard(link)}>
                <ContentCopyIcon sx={{ height: '18px', width: '18px' }} />
              </IconButton>
            </Typography>
          </Box>
          <Box>
            <Box sx={{ mx: 'auto', maxWidth: '260px', background: '#fff', p: 3, mb: 2, borderRadius: '12px' }}>
              <QRCode
                size={180}
                value={link}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </Box>
          </Box>
        </Collapse>
        <Collapse in={scanned}>
          <Typography sx={{ textAlign: 'center' }}>
            Please follow instructions on Mobile Wallet to submit the transaction
          </Typography>
        </Collapse>
      </Collapse>
      <Collapse in={submitting === 'failed'}>
        <Box
          sx={{
            textAlign: 'center',
          }}
        >
          <CancelOutlinedIcon sx={{ fontSize: '120px' }} />
          <Typography
            sx={{
              fontWeight: '600',
              mb: '12px'
            }}
          >
            Transaction failed, please try again.
          </Typography>
        </Box>
      </Collapse>
    </>
  );
};

export default ProcessTransaction;