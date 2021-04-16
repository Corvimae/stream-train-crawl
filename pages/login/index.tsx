import styled from 'styled-components';
import Link from 'next/link';
export default function Login() {
  return (
    <Container>
      <Title>flygon needs you to log into nightbot.</Title>

      <Link href="/auth">
        <Button>do it</Button>
      </Link>
    </Container>
  );
}

const Container = styled.div`
  position: absolute;
  display: flex;
  left: 50%;
  top: 50%;
  width: 40rem;
  height: 40em;
  transform: translate(-50%, -50%);
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;

const Title = styled.div`
  font-weight: 700;
  font-size: 1.25rem;
  margin-bottom: 2rem;
`;

const Button = styled.div`
  display: flex;
  height: 2rem;
  flex-direction: row;
  align-items: center;
  justify-content: center;
  font-weight: 700;
  appearance: none;
  font-family: inherit;
  font-size: inherit;
  margin: 0;
  padding: 0.25rem 1rem;
  border-radius: 1rem;
  background-color: #333;
  color: #fff;
  border: none;
  cursor: pointer;
  &:hover:not(:disabled) {
    background-color: #555;
  }
  &:disabled {
    opacity: 0.5;
  }
`;