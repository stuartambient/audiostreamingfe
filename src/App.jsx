import { useState, useEffect, useRef, useReducer } from "react";
import { GiPauseButton, GiPlayButton } from "react-icons/gi";
import { FaForward, FaBackward, FaListUl, FaHeart } from "react-icons/fa";
import { Buffer } from "buffer";
import {
  convertDuration,
  convertDurationSeconds,
  convertCurrentTime,
  convertToSeconds,
} from "./hooks/useTime";
import InfiniteList from "./Components/InfiniteList";
import "./App.css";

function App() {
  const audioPlayer = {
    library: false,
    active: "",
    newtrack: "",
    playNext: false,
    playPrev: false,
    nextTrack: "",
    prevTrack: "",
    artist: "",
    title: "",
    album: "",
    cover: "",
    duration: "",
    currentTime: "",
    pause: false,
    progbarInc: 0,
    currentVolume: 1.0,
    filesPageNumber: 0,
    albumsPageNumber: 0,
    type: "files",
    searchTermFiles: "",
    searchTermAlbums: "",
    randomize: false,
    albumPath: "",
    showMore: null,
  };

  const reducer = (state, action) => {
    switch (action.type) {
      case "library": {
        return { ...state, library: !state.library };
      }
      case "pauseplay": {
        return { ...state, pause: !state.pause };
      }
      case "direction": {
        return {
          ...state,
          playNext: action.playNext,
          playPrev: action.playPrev,
        };
      }
      case "newtrack": {
        return {
          ...state,
          pause: action.pause,
          newtrack: action.newtrack,
          artist: action.artist,
          title: action.title,
          album: action.album,
          cover: action.cover,
          active: action.active,
          nextTrack: action.nextTrack,
          prevTrack: action.prevTrack,
        };
      }
      case "duration": {
        return {
          ...state,
          duration: action.duration,
        };
      }

      case "current-time": {
        return {
          ...state,
          currentTime: action.currentTime,
        };
      }
      case "set-next-track": {
        return {
          ...state,
          nextTrack: action.nextTrack,
        };
      }

      case "set-prev-track": {
        return {
          ...state,
          prevTrack: action.prevTrack,
        };
      }
      default:
        return;
    }
  };

  const [state, dispatch] = useReducer(reducer, audioPlayer);
  /* const [currentTrack, setCurrentTrack] = useState(); */

  const audio = new Audio();
  const audioRef = useRef(audio);
  /* const [duration, setDuration] = useState(""); */
  /* const [currentTime, setCurrentTime] = useState(""); */
  const [progbarInc, setProgbarInc] = useState(0);

  const seekbarOutline = useRef();
  const volumebarOutline = useRef();
  const volumeslider = useRef();

  const handleClick = e => {
    let id;

    e.target.id ? (id = e.target.id) : (id = e.target.parentNode.id);
    switch (id) {
      case "playlist":
        dispatch({
          type: "library",
        });
        break;
      case "pauseplay":
        dispatch({
          type: "pauseplay",
        });
        break;
      case "backward":
        dispatch({
          type: "direction",
          playNext: false,
          playPrev: true,
        });
        break;
      case "forward":
        dispatch({
          type: "direction",
          playPrev: false,
          playNext: true,
        });
        break;
      default:
        return;
    }
  };

  useEffect(() => {
    audioRef.current.onloadedmetadata = async () => {
      audioRef.current.play();
      dispatch({
        type: "duration",
        duration: convertDuration(audioRef.current),
      });
    };
  });

  useEffect(() => {
    audioRef.current.ontimeupdate = () => {
      dispatch({
        type: "current-time",
        currentTime: convertCurrentTime(audioRef.current),
      });
    };
  }, [audioRef]);

  useEffect(() => {
    audioRef.current.onended = () => {
      dispatch({
        type: "direction",
        playNext: true,
      });
    };
  }, [audioRef]);

  useEffect(() => {
    if (state.pause) audioRef.current.pause();
    if (!state.pause) audioRef.current.play();
  }, [state.pause, audioRef]);

  useEffect(() => {
    const outlineWidth = seekbarOutline.current.clientWidth;
    const convertForProgbar = convertToSeconds(
      state.duration,
      state.currentTime
    );
    /* console.log(convertForProgbar * outlineWidth); */
    setProgbarInc(convertForProgbar * outlineWidth);
  }, [state.duration, state.currentTime]);

  const handlePicture = buffer => {
    if (buffer === null || buffer.data === null) return "not available";
    const bufferToString = Buffer.from(buffer.data).toString("base64");
    return `data:${buffer.format};base64,${bufferToString}`;
  };

  const handleListItem = async (e, artist, title, album, picture = null) => {
    e.preventDefault();

    dispatch({
      type: "newtrack",
      pause: false,
      newtrack: +e.target.getAttribute("val"),
      artist,
      title,
      album,
      cover: handlePicture(picture),
      active: e.target.id,
      nextTrack: "",
      prevTrack: "",
    });

    dispatch({
      type: "direction",
      playNext: false,
      playPrev: false,
    });

    audioRef.current.src = `http://localhost:3008/tracks/${e.target.id}`;
    audioRef.current.load();
  };

  const handleSeekTime = e => {
    if (e.buttons !== 1) console.log(e.buttons !== 1);
    const totaltime = convertDurationSeconds(state.duration);
    /* const seekbar = document.querySelector('.seekbar'); */
    const seekbarOutlineWidth = seekbarOutline.current.clientWidth;
    const seekPoint =
      e.clientX - seekbarOutline.current.getBoundingClientRect().left;

    audioRef.current.currentTime =
      (totaltime / seekbarOutlineWidth) * seekPoint;
  };

  const handleVolume = e => {
    if (e.buttons !== 1) return;

    const outlineRect = volumebarOutline.current.getBoundingClientRect();
    const outlineWidth = Math.round(outlineRect.width);
    const widthRange = e.clientX - volumebarOutline.current.offsetLeft;

    if (widthRange > 0 || widthRange < outlineWidth) {
      const mark = widthRange / outlineWidth;
      audioRef.current.volume = Math.round(mark * 10) / 10;

      volumeslider.current.setAttribute("style", `width:${widthRange}px`);
    } else {
      return;
    }
  };

  return (
    <div className="container">
      <div className="audio-player">
        <div className="title">
          {state.title ? <>{state.title.slice(0, 20)}</> : null}
        </div>

        {state.cover && state.cover !== "no available image" ? (
          <>
            <div className="image">
              <img src={state.cover} alt="" />
            </div>
          </>
        ) : (
          <p>{state.cover}</p>
        )}
        <div className="metadata">
          <>
            {state.artist ? (
              <div>
                <span className="label">Artist: </span>
                <span className="real-time">{state.artist.slice(0, 25)}</span>
              </div>
            ) : null}
            {state.album ? (
              <div>
                <span className="label">Album: </span>
                <span className="real-time">{state.album.slice(0, 25)}</span>
              </div>
            ) : null}
          </>
        </div>
        <div style={{ color: "white" }}>{audioRef.current.volume * 10}</div>
        <div
          className="volume-outline"
          onMouseMove={handleVolume}
          ref={volumebarOutline}
        >
          <div className="volumebar" ref={volumeslider}></div>
        </div>
        <div className="time">
          <span className="label">Duration: </span>
          <span className="real-time">{state.duration}</span>
          <span className="label">Elapsed: </span>
          <span className="real-time">{state.currentTime}</span>
        </div>

        <div
          className="seekbar-outline"
          ref={seekbarOutline}
          onClick={handleSeekTime}
        >
          <div
            className="seekbar"
            style={{ width: progbarInc ? `${progbarInc}px` : null }}
          ></div>
        </div>
        <ul className="controls">
          <li className="btn" id="like" onClick={e => handleClick(e)}>
            <FaHeart id="like" className="icon" />
          </li>

          {state.pause ? (
            <li className="btn" id="pauseplay" onClick={e => handleClick(e)}>
              <GiPlayButton id="pauseplay" className="icon" />
            </li>
          ) : (
            <li className="btn" id="pauseplay" onClick={e => handleClick(e)}>
              <GiPauseButton id="pauseplay" className="icon" />
            </li>
          )}
          <li className="btn" id="backward" onClick={e => handleClick(e)}>
            <FaBackward id="backward" className="icon" />
          </li>

          <li className="btn" id="forward" onClick={e => handleClick(e)}>
            <FaForward id="forward" className="icon" />
          </li>
          <li className="btn" id="playlist" onClick={e => handleClick(e)}>
            <FaListUl id="playlist" className="icon" />
          </li>
        </ul>
      </div>
      {state.library ? (
        <InfiniteList
          onClick={handleListItem}
          currentTrack={state.newtrack}
          playNext={state.playNext}
          playPrev={state.playPrev}
          nextTrack={state.nextTrack}
          prevTrack={state.prevTrack}
          active={state.active}
          dispatch={dispatch}
          handlePicture={handlePicture}
          /* setCurrentTrack={setCurrentTrack} */
        />
      ) : null}
    </div>
  );
}

export default App;
