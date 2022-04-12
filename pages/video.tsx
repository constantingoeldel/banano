export default function Video() {
  return (
    <video autoPlay preload="auto" muted loop>
      <source src="/demo.mp4" type="video/mp4" />
      Sorry, your browser doesn&apos;t support embedded videos.
    </video>
  );
}
