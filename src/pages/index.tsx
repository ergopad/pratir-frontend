import React, { useState, useEffect } from 'react';
import type { NextPage } from 'next'
import { useRouter } from "next/router";
import {
  Container,
} from '@mui/material'
import MintSaleInfoStatic from '@components/sales/MintSaleInfoStatic';
import { GetStaticProps } from 'next';
import { fetchSaleData } from '@utils/fetchSaleData';

export const getStaticProps: GetStaticProps = async () => {
  try {
    const data = await fetchSaleData();
    return {
      props: {
        data,
      },
      revalidate: 120,
    };
  } catch (error) {
    console.error("Failed to fetch sale data:", error);
    throw new Error(`Failed to fetch sale data: ${error instanceof Error ? error.message : 'unknown error'}`);
  }
};

interface HomeProps {
  data: ISale;
}

const Home: NextPage<HomeProps> = ({ data }) => {
  return <MintSaleInfoStatic saleData={data} />
}

export default Home
