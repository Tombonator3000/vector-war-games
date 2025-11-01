import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useEffect, useMemo, useRef, useState } from "react";

export interface CreditsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreditSection {
  title: string;
  names: string[];
}

export function CreditsDialog({ open, onOpenChange }: CreditsDialogProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [audioError, setAudioError] = useState<string | null>(null);

  const creditSections = useMemo<CreditSection[]>(
    () => [
      { title: "Presented By", names: ["Tom Husby"] },
      { title: "Directed By", names: ["Tom Husby"] },
      { title: "Produced By", names: ["Tom Husby", "Tom Husby"] },
      { title: "Executive Producer", names: ["Tom Husby"] },
      { title: "Written By", names: ["Tom Husby"] },
      { title: "Lead Designer", names: ["Tom Husby"] },
      { title: "Art Direction", names: ["Tom Husby"] },
      { title: "3D Visualization", names: ["Tom Husby"] },
      { title: "Engineering", names: ["Tom Husby", "Tom Husby", "Tom Husby"] },
      { title: "UI/UX", names: ["Tom Husby"] },
      { title: "Systems Design", names: ["Tom Husby"] },
      { title: "Narrative", names: ["Tom Husby"] },
      { title: "Crisis Simulation", names: ["Tom Husby"] },
      { title: "QA Lead", names: ["Tom Husby"] },
      { title: "Operations", names: ["Tom Husby"] },
      { title: "Special Thanks", names: ["Tom Husby", "Tom Husby", "Tom Husby", "Tom Husby"] },
    ],
    []
  );

  const soundtrackSrc = useMemo(() => {
    const base = import.meta.env.BASE_URL.endsWith("/")
      ? import.meta.env.BASE_URL
      : `${import.meta.env.BASE_URL}/`;

    return `${base}${encodeURI("Muzak/Run Run.mp3")}`;
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) {
      return;
    }

    audio.loop = true;
    audio.volume = 0.6;

    if (open) {
      setAudioError(null);
      const playPromise = audio.play();
      if (playPromise) {
        playPromise.catch((error) => {
          if (error?.name !== "AbortError") {
            setAudioError("Unable to start soundtrack. Adjust autoplay settings and try again.");
          }
        });
      }
    } else {
      audio.pause();
      audio.currentTime = 0;
    }

    return () => {
      audio.pause();
    };
  }, [open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="credits-dialog">
        <DialogHeader>
          <DialogTitle className="credits-dialog__title">Command Center Credits</DialogTitle>
          <DialogDescription className="credits-dialog__description">
            Roll call for the brave souls keeping NORAD Vector online.
          </DialogDescription>
        </DialogHeader>
        <div className="credits-dialog__body">
          <div className="credits-dialog__gradient credits-dialog__gradient--top" aria-hidden="true" />
          <div className="credits-dialog__gradient credits-dialog__gradient--bottom" aria-hidden="true" />
          <div className="credits-roll">
            <div className="credits-roll__inner">
              <p className="credits-roll__intro">NORAD VECTOR COMMAND</p>
              <p className="credits-roll__tagline">An All-Tom Husby Production</p>
              {creditSections.map((section, index) => (
                <div className="credits-roll__section" key={`${section.title}-${index}`}>
                  <p className="credits-roll__heading">{section.title}</p>
                  {section.names.map((name, nameIndex) => (
                    <p className="credits-roll__name" key={`${section.title}-${nameIndex}`}>{name}</p>
                  ))}
                </div>
              ))}
              <p className="credits-roll__footer">End of Line</p>
            </div>
          </div>
        </div>
        {audioError ? (
          <p className="credits-dialog__audio-error" role="status">
            {audioError}
          </p>
        ) : (
          <p className="credits-dialog__hint">Press ESC or the close button to return to the command menu.</p>
        )}
        <audio
          ref={audioRef}
          src={soundtrackSrc}
          preload="auto"
          onError={() =>
            setAudioError("Soundtrack file missing. Place 'Run Run.mp3' inside the Muzak directory.")
          }
        />
      </DialogContent>
    </Dialog>
  );
}
