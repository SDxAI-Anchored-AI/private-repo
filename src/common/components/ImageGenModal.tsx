import { Box, Button, Divider, Modal, ModalDialog, Slider, Textarea, Tooltip, Typography } from '@mui/joy';
import { useState } from 'react';
import InfoIcon from '@mui/icons-material/Info';

export function ImageGenModal(props: {
  open: boolean;
  onClose: () => void;
  onPositive: (content: string, messageProps?: unknown) => void;

  positiveActionText: string;
}) {
  const [denoisingSteps, setDenoisingSteps] = useState(20);
  const handleDenoisingChange = (event: Event, newValue: number | number[]) => setDenoisingSteps(newValue as number);
  const [frozenStepsRatio, setFrozenStepsRatio] = useState(0.4);
  const handleFrozenStepsChange = (event: Event, newValue: number | number[]) => setFrozenStepsRatio(newValue as number);
  const [text, setText] = useState('');

  function reset() {
    setDenoisingSteps(20);
    setFrozenStepsRatio(0.4);
    setText('');
  }

  const handleEditTextChanged = (e: React.ChangeEvent<HTMLTextAreaElement>) => setText(e.target.value);
  return (
    <Modal open={props.open} onClose={props.onClose}>
      <ModalDialog variant="outlined" color="neutral" sx={{ maxWidth: '100vw', minWidth: '50vw' }}>
        <Typography component="h2">Image Generation</Typography>
        <Typography sx={{ my: 2 }}>Prompt</Typography>
        <Textarea
          autoFocus
          minRows={5}
          value={text}
          onChange={handleEditTextChanged}
          placeholder="A realistic photo of a wooden table with an apple on the left and a pear on the right.&nbsp;A realistic photo of 4 TVs on a wall.&nbsp;A realistic photo of a gray cat and an orange dog on the grass.&nbsp;In an empty indoor scene, a blue cube directly above a red cube with a vase on the left of them.&nbsp;A realistic photo of a wooden table without bananas in an indoor scene&nbsp;A realistic photo of two cars on the road."
          sx={{ mb: 2 }}
        />
        {/* <Divider sx={{ my: 2 }} /> */}
        <Typography>
          Number of denoising steps: {denoisingSteps}&nbsp;
          <Tooltip variant="solid" placement="top-start" title="Set to &gt;=50 for higher generation quality">
            <InfoIcon />
          </Tooltip>
        </Typography>
        <Slider
          color="neutral"
          min={1}
          max={250}
          defaultValue={20}
          value={denoisingSteps}
          onChange={handleDenoisingChange}
          valueLabelDisplay="auto"
          sx={{ py: 1, my: 1.1 }}
        />

        <Typography>
          Foreground frozen steps ratio: {frozenStepsRatio}&nbsp;
          <Tooltip
            variant="solid"
            placement="top-start"
            title={
              <>
                Higher: preserve object attributes;
                <br />
                Lower: higher coherence;
                <br />
                Set to 0: (almost) equivalent to vanilla GLIGEN except details
              </>
            }
          >
            <InfoIcon />
          </Tooltip>
        </Typography>
        <Slider
          color="neutral"
          min={0}
          max={1}
          defaultValue={0.4}
          value={frozenStepsRatio}
          onChange={handleFrozenStepsChange}
          valueLabelDisplay="auto"
          sx={{ py: 1, my: 1.1 }}
        />

        <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end', mt: 2 }}>
          <Button
            variant="plain"
            color="neutral"
            onClick={() => {
              props.onClose();
              reset();
            }}
          >
            Cancel
          </Button>
          <Button
            variant="solid"
            color="success"
            onClick={() => {
              props.onPositive(text, {
                denoisingSteps,
                frozenStepsRatio,
              });
              reset();
            }}
          >
            {props.positiveActionText}
          </Button>
        </Box>
      </ModalDialog>
    </Modal>
  );
}
