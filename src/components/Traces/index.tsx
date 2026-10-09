import React from 'react'
import { Box, Typography } from '@mui/material'
import { ScatterChart } from '@mui/x-charts'
import type { OSMID } from '../../osrm-api/types'

interface Props {
  timeUnderBridge: Record<OSMID, number>
  nodeData: {
    id: number
    distanceAlongRoute: number
  }[]
  maxRtt: Record<OSMID, number>
  pktsToRttNorm: Record<OSMID, number>
}

function Traces({ timeUnderBridge, nodeData, maxRtt, pktsToRttNorm }: Props) {
  return (
    <>
      {(
        [
          [timeUnderBridge, 'Burst length'],
          [maxRtt, 'Max RTT'],
          [
            pktsToRttNorm,
            'Amount of packets after bridge to return to normal RTT'
          ]
        ] as const
      ).map(([obj, label]) => (
        <Box
          key={label}
          width='100%'
          height={500}
          display='flex'
          flexDirection='column'
          alignItems='center'
          sx={{ mt: 10 }}
        >
          <Typography variant='h3'>{label}</Typography>
          <ScatterChart
            series={[
              {
                data: Object.entries(obj)
                  .filter(([id]) => timeUnderBridge[Number(id)])
                  .map(([id, val]) => ({
                    x: Number(
                      nodeData
                        .find((node) => node.id === Number(id))!
                        .distanceAlongRoute.toFixed(2)
                    ),
                    y: Number(val.toFixed(2)),
                    id
                  }))
              }
            ]}
            xAxis={[
              {
                label: 'Distance along route'
              }
            ]}
            yAxis={[
              {
                label
              }
            ]}
          />
        </Box>
      ))}
    </>
  )
}

export default React.memo(Traces)
