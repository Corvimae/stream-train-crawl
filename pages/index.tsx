import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { useRouter } from 'next/router'
import { leftPadPixelMap, messageToPixelMap, rightPadPixelMapToWidth, scalePixelMap, verticallyCenterPixelMap } from '../utils/letter';

const PIXEL_SIZE = 8;

const SCROLL_DELAY_MS = 60;

const GRID_WIDTH = 62;
const GRID_HEIGHT = 27;

function slicePixelMap(pixelMap, offset) {
  return rightPadPixelMapToWidth(pixelMap.map(row => row.slice(offset, offset + GRID_WIDTH)), GRID_WIDTH);
}

export default function Home() {
  const scrollOffset = useRef(0);
  const [messageOffset, setMessageOffset] = useState(0);
  const pendingSongInfo = useRef(null);
  const router = useRouter();

  const messageList = useMemo(() => [...((router.query.messages as string)?.split(/\|/g) ?? ['Please stand by.'])], [router.query.messages]);
  
  const activeMessageMap = useMemo(() => {
    return leftPadPixelMap(verticallyCenterPixelMap(rightPadPixelMapToWidth(scalePixelMap(messageToPixelMap(messageList[messageOffset]), 1), GRID_WIDTH), GRID_HEIGHT), GRID_WIDTH);
  }, [messageList, messageOffset]);

  const [activeMessageSubsection, setActiveMessageSubsection] = useState(slicePixelMap(activeMessageMap, scrollOffset.current));

  useEffect(() => {
    const updateFrame = () => {
      scrollOffset.current = scrollOffset.current + 1;

      if (scrollOffset.current > activeMessageMap[0].length) {
        scrollOffset.current = 0;
        setMessageOffset((messageOffset + 1) % messageList.length);

        if (pendingSongInfo.current !== null) {
          setMessageOffset(0);

          pendingSongInfo.current = null;
        }
      }

      setActiveMessageSubsection(slicePixelMap(activeMessageMap, scrollOffset.current))
    };

    const intervalId = setInterval(updateFrame, SCROLL_DELAY_MS);

    updateFrame();

    return () => {
      clearTimeout(intervalId);
    };
  }, [activeMessageMap, messageList]);
  
  return (
    <div>
      <MatrixContainer>
        <Matrix>
          {activeMessageSubsection.map((rowMap, y) => (
            rowMap.map((active, x) => (
              <Pixel key={`(${x}, ${y})`} active={active} />
            ))
          ))}
        </Matrix>
      </MatrixContainer>
    </div>
  )
}

const MatrixContainer = styled.div`
  position: absolute;
  display: flex;
  top: 16px;
  left: 16px;
  width: 623px;
  height: 273px;
  justify-content: center;
  align-items: center;
`;

const Matrix = styled.div`
  display: grid;
  grid-template-columns: repeat(${GRID_WIDTH}, ${PIXEL_SIZE}px);
  grid-template-rows: repeat(${GRID_HEIGHT}, ${PIXEL_SIZE}px);
  grid-gap: 2px;

`;

const Pixel = styled.div`
  width: 100%;
  height: 100%;
  border-radius: 50%;
  background-color: ${props => props.active ? '#e18039' : '#1a1a1a'};
`;