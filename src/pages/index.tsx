import React, { FC } from 'react';
import type { NextPage } from 'next'
import {
  Grid,
  Container,
  Typography,
  Box,
  Button,
  Card,
  CardContent,
  Avatar,
  useTheme,
  useMediaQuery,
  SvgIcon
} from '@mui/material'
import NftCard from '@components/NftCard';
import NextLink from 'next/link'
import Link from '@components/Link'
import Logo from '@components/svgs/Logo'
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import ButtonLink from '@components/ButtonLink'
import Image from 'next/image';
import CardSlider from '@components/CardSlider'
import DiamondIcon from '@components/svgs/DiamondIcon'
import { recentNfts } from '@components/placeholders/recentNfts'

const features = [
  {
    icon: <DiamondIcon sx={{ fontSize: '48px' }} />,
    title: 'Feature 1',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse a, risus nec condimen tum volutpat accumsan.',
  },
  {
    icon: <DiamondIcon sx={{ fontSize: '48px' }} />,
    title: 'Feature 2',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse a, risus nec condimen tum volutpat accumsan.',
  },
  {
    icon: <DiamondIcon sx={{ fontSize: '48px' }} />,
    title: 'Feature 3',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse a, risus nec condimen tum volutpat accumsan.',
  },
  {
    title: 'Feature 4',
    content: 'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Suspendisse a, risus nec condimen tum volutpat accumsan.',
  },
]

const Home: NextPage = () => {
  const theme = useTheme()
  const upSm = useMediaQuery(theme.breakpoints.up('sm'))
  return (
    <>

      {/* HERO SECTION */}
      <Container sx={{ mb: '100px' }}>

      </Container>
    </>
  )
}

export default Home
