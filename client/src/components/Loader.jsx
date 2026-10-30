import styled from "styled-components";

const Loader = () => {
  return (
    <Wrapper>
      <video
        src={`${import.meta.env.BASE_URL}loader.mp4`}
        autoPlay
        loop
        muted
        playsInline
        className="video"
      />
    </Wrapper>
  );
};

const Wrapper = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120px;
  height: 120px;

  .video {
    width: 100px;
    height: 100px;
    object-fit: contain;
    pointer-events: none;
  }
`;

export default Loader;
