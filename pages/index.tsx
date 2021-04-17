import { useEffect, useMemo, useRef, useState } from 'react';
import styled from 'styled-components';
import { leftPadPixelMap, messageToPixelMap, rightPadPixelMapToWidth, scalePixelMap, verticallyCenterPixelMap } from '../utils/letter';

const QUEUE_POLL_INTERVAL_MS = 10000;
const PIXEL_SIZE = 8;

const SCROLL_DELAY_MS = 70;

const GRID_WIDTH = 62;
const GRID_HEIGHT = 27;

function slicePixelMap(pixelMap, offset) {
  return rightPadPixelMapToWidth(pixelMap.map(row => row.slice(offset, offset + GRID_WIDTH)), GRID_WIDTH);
}

export default function Home() {
  const scrollOffset = useRef(0);
  const [messageOffset, setMessageOffset] = useState(0);
  const pendingSongInfo = useRef(null);

  const [currentSongInfo, setCurrentSongInfo] = useState(null);
  
  const messageList = useMemo(() => [
    currentSongInfo ? `Playing ${currentSongInfo.track.title} by ${currentSongInfo.track.artist} (requested by ${currentSongInfo.user.displayName})` : 'There are no requests.',
    'Request a song with !sr'
  ], [currentSongInfo]);
  
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
          setCurrentSongInfo(pendingSongInfo.current);
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

  useEffect(() => {
    const fetchCurrentSongInfo = async () => {
      const response = await fetch('/playing');

      const { _currentSong: currentSong } = await response.json();

      if (currentSongInfo?._id !== currentSong._id && pendingSongInfo.current === null) {
        console.log('setting current song');
        pendingSongInfo.current = currentSong;
      }
    };

    const intervalId = setInterval(fetchCurrentSongInfo, QUEUE_POLL_INTERVAL_MS);

    fetchCurrentSongInfo();

    return () => {
      clearTimeout(intervalId);
    };
  }, [currentSongInfo]);
  
  return (
    <div>
      <FlygonImage src="flygon.png" />
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

export async function getServerSideProps(ctx) {
  if (!ctx.req.isAuthenticated()) {
    return {
      redirect: {
        permanent: false,
        destination: '/login',
      },
    };
  }

  return {
    props: {},
  };
}


const FlygonImage = styled.img`
  width: 1000px;
  height: 1000px;
`;

const MatrixContainer = styled.div`
  position: absolute;
  display: flex;
  top: 422px;
  left: 140px;
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