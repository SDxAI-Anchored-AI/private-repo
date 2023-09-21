import * as React from 'react';

import { Box, IconButton, Tooltip } from '@mui/joy';
import ReplayIcon from '@mui/icons-material/Replay';
import ZoomOutMapIcon from '@mui/icons-material/ZoomOutMap';

import { Link } from '~/common/components/Link';

import { BlobBlock } from './Block';

export const RenderBlob = (props: { blobBlock: BlobBlock }) => (
  <Box
    sx={(theme) => ({
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      position: 'relative',
      mx: 1.5,
      // p: 1, border: '1px solid', borderColor: 'divider', borderRadius: 1,
      minWidth: 32,
      minHeight: 32,
      boxShadow: theme.shadow.md,
      background: theme.palette.neutral.solidBg,
      '& picture': { display: 'flex' },
      '& img': { maxWidth: '100%', maxHeight: '100%' },
      '&:hover > .image-buttons': { opacity: 1 },
    })}
  >
    {/* External Image */}
    <picture>
      <img src={props.blobBlock.url} alt="Generated Image" />
    </picture>
    {/* Image Buttons */}
    <Box
      className="image-buttons"
      sx={{
        position: 'absolute',
        top: 0,
        right: 0,
        zIndex: 10,
        pt: 0.5,
        px: 0.5,
        display: 'flex',
        flexDirection: 'row',
        gap: 0.5,
        opacity: 0,
        transition: 'opacity 0.3s',
      }}
    >
      {/* <IconButton component={Link} href={props.imageBlock.url} target="_blank" variant="solid" color="neutral">
        <ZoomOutMapIcon />
      </IconButton> */}
    </Box>
  </Box>
);
