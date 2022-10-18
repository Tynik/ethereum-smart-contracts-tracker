import React, { useCallback, useState } from 'react';
import { Box, Button, Grid, Stack, TextField, Typography } from '@mui/material';
import {
  Alchemy,
  AssetTransfersCategory,
  AssetTransfersOrder,
  AssetTransfersResult,
  Network,
} from 'alchemy-sdk';
import { useHoneyForm } from '@tynik/react-honey-form';

import { Draw, DrawZone, drawAddressElement } from '~/components';
import { isPointInPath } from '~/helpers';

const ADDRESS_ELEMENT_WIDTH = 150;
const ADDRESS_ELEMENT_HEIGHT = 70;
const ADDRESSES_MIN_DISTANCE = 50;

type AssetTransfersMap = Record<AssetTransfersResult['from'], AssetTransfersResult[]>;

type TrackForm = {
  alchemySdkApiKey: string;
  address: string;
};

const Main = () => {
  const [assetTransfersMap, setAssetTransfersMap] = useState<AssetTransfersMap>({});

  const [selectedAssetTransfers, setSelectedAssetTransfers] = useState<
    AssetTransfersResult[] | null
  >(null);

  const { formFields, submit } = useHoneyForm<TrackForm>({
    fields: {
      alchemySdkApiKey: {
        value: process.env.ALCHEMY_SDK_API_KEY || '',
      },
      address: {
        value: '',
      },
    },
    onSubmit: async data => {
      const settings = {
        apiKey: data.alchemySdkApiKey,
        network: Network.ETH_MAINNET,
      };

      const alchemy = new Alchemy(settings);

      const assetTransfersResponse = await alchemy.core.getAssetTransfers({
        toAddress: data.address,
        category: [
          AssetTransfersCategory.EXTERNAL,
          // AssetTransfersCategory.INTERNAL,
          AssetTransfersCategory.ERC20,
          AssetTransfersCategory.ERC721,
          AssetTransfersCategory.ERC1155,
          AssetTransfersCategory.SPECIALNFT,
        ],
        order: AssetTransfersOrder.DESCENDING,
        withMetadata: true,
      });

      console.log(assetTransfersResponse.transfers);

      setAssetTransfersMap(
        assetTransfersResponse.transfers.reduce((result, assetTransfer) => {
          if (!result[assetTransfer.from]) {
            result[assetTransfer.from] = [];
          }
          result[assetTransfer.from].push(assetTransfer);
          return result;
        }, {} as AssetTransfersMap)
      );
    },
  });

  const draw = useCallback<Draw>(
    (ctx, { moveMouseEvent, events }) => {
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

      const { width, height } = ctx.canvas.getBoundingClientRect();

      const maxCountAddressesHorizontal = Math.floor(
        width / (ADDRESS_ELEMENT_WIDTH + ADDRESSES_MIN_DISTANCE)
      );
      const maxCountAddressesVertical = Math.floor(
        height / (ADDRESS_ELEMENT_HEIGHT + ADDRESSES_MIN_DISTANCE)
      );

      const freeAddressPlaces: { x: number; y: number }[] = [];

      for (let h = 0; h < maxCountAddressesHorizontal; h += 1) {
        for (let v = 0; v < maxCountAddressesVertical; v += 1) {
          freeAddressPlaces.push({
            x: ADDRESSES_MIN_DISTANCE + h * (ADDRESS_ELEMENT_WIDTH + ADDRESSES_MIN_DISTANCE),
            y: ADDRESSES_MIN_DISTANCE + v * (ADDRESS_ELEMENT_HEIGHT + ADDRESSES_MIN_DISTANCE),
          });
        }
      }

      // freeAddressPlaces.forEach(freePlace => {
      //   drawRoundRect(
      //     ctx,
      //     freePlace.x,
      //     freePlace.y,
      //     ADDRESS_ELEMENT_WIDTH,
      //     ADDRESS_ELEMENT_HEIGHT,
      //     4,
      //     {
      //       strokeStyle: 'grey',
      //     }
      //   );
      // });

      const rootAddressFreePlaceIndex = Math.floor((freeAddressPlaces.length - 1) / 2);
      const rootAddressFreePlace = freeAddressPlaces[rootAddressFreePlaceIndex];

      const rootAddressElement = drawAddressElement({
        ctx,
        x: rootAddressFreePlace.x,
        y: rootAddressFreePlace.y,
        w: ADDRESS_ELEMENT_WIDTH,
        h: ADDRESS_ELEMENT_HEIGHT,
        address: 'root',
        moveMouseEvent,
      });

      freeAddressPlaces.splice(rootAddressFreePlaceIndex, 1);

      const onClickEvent = events.find(event => event.type === 'onclick');

      Object.keys(assetTransfersMap).forEach(address => {
        const addressFreePlaceIndex = Math.floor((freeAddressPlaces.length - 1) / 2);
        const addressFreePlace = freeAddressPlaces[addressFreePlaceIndex];

        if (!addressFreePlace) {
          return;
        }

        const addressElement = drawAddressElement({
          ctx,
          x: addressFreePlace.x,
          y: addressFreePlace.y,
          w: ADDRESS_ELEMENT_WIDTH,
          h: ADDRESS_ELEMENT_HEIGHT,
          connect: rootAddressElement,
          connectLabel: assetTransfersMap[address].length,
          address,
          moveMouseEvent,
        });

        freeAddressPlaces.splice(addressFreePlaceIndex, 1);

        if (onClickEvent) {
          if (
            isPointInPath(
              ctx,
              addressElement.path,
              onClickEvent.event.offsetX,
              onClickEvent.event.offsetY
            )
          ) {
            setSelectedAssetTransfers(assetTransfersMap[address]);
          }
        }
      });
    },
    [assetTransfersMap]
  );

  const assetTransfersInfo = Object.keys(assetTransfersMap).reduce(
    (result, address) => {
      assetTransfersMap[address].forEach(assetTransfer => {
        if (assetTransfer.category === AssetTransfersCategory.EXTERNAL) {
          result.external += 1;
          //
        } else if (assetTransfer.category === AssetTransfersCategory.INTERNAL) {
          result.internal += 1;
          //
        } else if (assetTransfer.category === AssetTransfersCategory.ERC721) {
          result.erc721 += 1;
          //
        } else if (assetTransfer.category === AssetTransfersCategory.ERC20) {
          result.erc20 += 1;
          //
        } else if (assetTransfer.category === AssetTransfersCategory.ERC1155) {
          result.erc1155 += 1;
        }
      });
      return result;
    },
    {
      internal: 0,
      external: 0,
      erc721: 0,
      erc20: 0,
      erc1155: 0,
    }
  );

  return (
    <Grid spacing={2} padding={2} container>
      <Grid xs={8} item>
        <DrawZone draw={draw} debug={process.env.LOCAL_ENV === 'true'} />
      </Grid>

      <Grid xs={4} item>
        <Stack component="form" spacing={2} autoComplete="off" noValidate>
          <TextField
            label="Alchemy SDK API key"
            variant="outlined"
            {...formFields.alchemySdkApiKey.props}
          />

          <TextField label="Address 0x0" variant="outlined" {...formFields.address.props} />

          <Button
            variant="contained"
            onClick={submit}
            disabled={!formFields.alchemySdkApiKey.value || !formFields.address.value}
          >
            Track
          </Button>
        </Stack>

        <Box mt={2}>
          <Typography variant="body2">
            Addresses: {Object.keys(assetTransfersMap).length}
          </Typography>

          <Typography variant="body2">Internal: {assetTransfersInfo.internal}</Typography>

          <Typography variant="body2">External: {assetTransfersInfo.external}</Typography>

          <Typography variant="body2">ERC20: {assetTransfersInfo.erc20}</Typography>

          <Typography variant="body2">ERC721: {assetTransfersInfo.erc721}</Typography>

          <Typography variant="body2">ERC1155: {assetTransfersInfo.erc1155}</Typography>
        </Box>

        {selectedAssetTransfers && (
          <Box mt={2}>
            <Typography variant="body2">Transactions: {selectedAssetTransfers.length}</Typography>
          </Box>
        )}
      </Grid>
    </Grid>
  );
};

export default Main;
