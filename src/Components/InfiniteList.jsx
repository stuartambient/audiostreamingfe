import { useState, useRef, useCallback, useEffect } from "react";
/* import axios from 'axios'; */
import { GiMagnifyingGlass } from "react-icons/gi";
import { ArchiveAdd, Playlist, Shuffle, Plus, Minus } from "../assets/icons";
import { v4 as uuidv4 } from "uuid";
import { useFiles, useAlbums, useAlbumTracks } from "../hooks/useDb";
import Switch from "./Switch";
import "../style/InfiniteList.css";

const InfiniteList = ({
  onClick,
  currentTrack,
  setCurrentTrack,
  playNext,
  playPrev,
  nextTrack,
  prevTrack,
  active,
  dispatch,
  handlePicture,
}) => {
  const [filesPageNumber, setFilesPageNumber] = useState(0);
  const [albumsPageNumber, setAlbumsPageNumber] = useState(0);
  const [type, setType] = useState("files");
  const [searchTermFiles, setSearchTermFiles] = useState("");
  const [searchTermAlbums, setSearchTermFAlbums] = useState("");
  const [randomize, setRandomize] = useState(false);
  const [albumPath, setAlbumPath] = useState("");
  const [showMore, setShowMore] = useState(null);
  const { filesLoading, files, setFiles, hasMoreFiles, filesError } = useFiles(
    filesPageNumber,
    searchTermFiles
  );
  const { albumsLoading, albums, setAlbums, hasMoreAlbums, albumsError } =
    useAlbums(albumsPageNumber, searchTermAlbums);

  const { tracks, setTracks } = useAlbumTracks(albumPath);

  const albumTracks = tracks.map(track => {
    if (track.title) {
      return <li key={track.afid}>{track.title}</li>;
    } else {
      <li key={track.afid}>{track.audioFile}</li>;
    }
  });

  const scrollRef = useRef();
  const searchRef = useRef();

  useEffect(() => {
    /* if (!files[currentTrack + 1]) return; */

    if (currentTrack >= 0 && files[currentTrack + 1]) {
      /* setNextTrack(files[currentTrack + 1].afid); */
      dispatch({
        type: "set-next-track",
        nextTrack: files[currentTrack + 1].afid,
      });
    }

    if (currentTrack >= 1) {
      /* setPrevTrack(files[currentTrack - 1].afid); */
      console.log("ct: ", files[currentTrack - 1]);

      dispatch({
        type: "set-prev-track",
        prevTrack: files[currentTrack - 1].afid,
      });
    }
  }, [currentTrack, files, dispatch]);

  /*   const handleTrackChange = trackId => {
    const track = files.filter((i, index) => i.afid === trackId);
    const changeTrack = new Event("click", {
      bubbles: true,
      cancelable: false,
    });

    const toTrack = document.getElementById(trackId);
    toTrack.dispatchEvent(changeTrack);
  }; */

  useEffect(() => {
    const handleTrackChange = trackId => {
      const changeTrack = new Event("click", {
        bubbles: true,
        cancelable: false,
      });

      const toTrack = document.getElementById(trackId);
      toTrack.dispatchEvent(changeTrack);
    };

    if (playNext && nextTrack) {
      handleTrackChange(nextTrack);
    }
    if (playPrev && prevTrack) {
      handleTrackChange(prevTrack);
    }
  }, [playNext, nextTrack, playPrev, prevTrack, files]);

  /*  const handleStateChange = () => {
    setCurrentTrack(undefined);
    setNextTrack(undefined);
    setPrevTrack(undefined);
  }; */

  const handleTextSearch = e => {
    /* setTextSearch(e.target.value); */
    e.preventDefault();
    /* handleStateChange(); */

    if (type === "files") {
      setSearchTermFiles(e.currentTarget.textsearch.value);
      setFilesPageNumber(0);
      setFiles([]);
    } else {
      setSearchTermFAlbums(e.currentTarget.textsearch.value);
      setAlbumsPageNumber(0);
      setAlbums([]);
    }
  };

  /* Cannot update a component (`App`) while rendering a different component (`InfiniteList`). */

  const handleListScroll = e => {
    /* console.log(scrollRef.current); */
  };

  const handleAlbumTracksRequest = e => {
    const term = e.currentTarget.getAttribute("term");
    if (showMore === e.currentTarget.id) {
      setShowMore(null);
      setTracks([]);
      setAlbumPath(null);
    } else {
      setShowMore(e.currentTarget.id);
      setAlbumPath(term);
    }
    /*   showMore === e.currentTarget.id
      ? setShowMore(null)
      : setShowMore(e.currentTarget.id);
    setAlbumPath(term); */
  };

  const randomizeIcon = useRef(null);

  const handleRandomize = e => {
    setRandomize(!randomize);
    /* randomizeIcon.current.classlist.toggle("icon-on"); */

    if (e.target.classList.contains("menu-icons-active")) {
      e.target.classList.remove("menu-icons-active");
    } else {
      e.target.classList.add("menu-icons-active");
    }
  };

  const getKey = () => uuidv4();

  const filesObserver = useRef();
  const albumsObserver = useRef();

  const lastFileElement = useCallback(
    node => {
      if (filesLoading) return;
      /*  if (!hasMoreFiles) return setSearchTermFiles(""); */
      if (filesObserver.current) filesObserver.current.disconnect();
      filesObserver.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && hasMoreFiles) {
            /* console.log('entries: ', entries[0].isIntersecting, hasMore); */
            setFilesPageNumber(prevPageNumber => prevPageNumber + 1);
            /*    dispatch({
              type: "filesPageNumber",
            }); */
          }
        },
        {
          root: document.querySelector(".results"),
          rootMargin: "0px",
          threshold: 1.0,
        }
      );
      if (node) filesObserver.current.observe(node);
    },
    [filesLoading, hasMoreFiles]
  );

  const lastAlbumElement = useCallback(
    node => {
      if (albumsLoading) return;
      if (albumsObserver.current) albumsObserver.current.disconnect();
      albumsObserver.current = new IntersectionObserver(
        entries => {
          if (entries[0].isIntersecting && hasMoreAlbums) {
            /* console.log('entries: ', entries[0].isIntersecting, hasMore); */
            setAlbumsPageNumber(prevPageNumber => prevPageNumber + 1);
            /*  dispatch({
              type: "albumsPageNumber",
            }); */
          }
        },
        {
          root: document.querySelector(".results"),
          rootMargin: "0px",
          threshold: 1.0,
        }
      );
      if (node) albumsObserver.current.observe(node);
    },
    [albumsLoading, hasMoreAlbums]
  );

  const scrollToView = useCallback(
    node => {
      if (!node) return;
      if (active && node && node.getAttribute("id") === `${active}--item-div`) {
        scrollRef.current = node;
        /* scrollRef.current.scrollIntoView(); */
      }
      /*       if (active) {
        console.log(activeRef);
      } */
    },
    [active, scrollRef]
  );

  const byFiles = files.map((item, index) => {
    return (
      <div
        key={getKey()}
        id={`${item.afid}--item-div`}
        className={
          `${active}--item-div` === `${item.afid}--item-div`
            ? "item active"
            : "item"
        }
        ref={files.length === index + 1 ? lastFileElement : scrollToView}
      >
        <a
          href={item.afid}
          id={item.afid}
          val={index}
          onClick={e =>
            onClick(e, item.artist, item.title, item.album, item.picture)
          }
        >
          Artist: {item.artist ? item.artist : "not available"}
          <br></br>
          Title: {item.title ? item.title : "not available"}
          <br></br>
          Album: {item.album ? item.album : "not available"}>
        </a>
      </div>
    );
  });

  const byAlbums = albums.map((item, index) => {
    return (
      <div
        key={getKey()}
        id={item._id}
        className="item"
        ref={albums.length === index + 1 ? lastAlbumElement : scrollToView}
      >
        <a
          /* type="input"
          href="#" */
          href="http://"
          id={item._id}
          val={index}
          /* onClick={handleAlbumTracksRequest} */
          style={{ color: "white", cursor: "pointer" }}
        >
          {item.foldername}
        </a>
        <div
          id={item._id}
          term={item.fullpath}
          onClick={handleAlbumTracksRequest}
        >
          {showMore === item._id ? <Minus id="minus" /> : <Plus id="plus" />}
        </div>
        {albumPath === item.fullpath && tracks.length ? (
          <ul className="albumtracks">{albumTracks}</ul>
        ) : null}
      </div>
    );
  });

  return (
    <>
      <div className="search">
        <Switch type={type} setType={setType} />
        <div className="form">
          <form onSubmit={handleTextSearch}>
            <div className="formelements">
              <input
                type="text"
                className="textsearch"
                id="textsearch"
                ref={searchRef}
              />

              <button type="text" className="submitbtn">
                <div className="icon">
                  <GiMagnifyingGlass />
                </div>
              </button>
            </div>
          </form>
        </div>
        <ul className="topmenu">
          <li>
            <ArchiveAdd id="add2archive" />
            <span>Scan for changes</span>
          </li>
          <li>
            <Playlist id="playlist" />
            <span>Load playlist</span>
          </li>
          <li>
            <Shuffle id="shuffle" />
            <span>Shuffle playlist</span>
          </li>
        </ul>
      </div>
      <div className="results" onScroll={handleListScroll}>
        {type === "files" && !files.length && !filesLoading ? (
          <div className="noresults">No results</div>
        ) : null}
        {type === "albums" && !albums.length && !albumsLoading ? (
          <div className="noresults">No results</div>
        ) : null}
        {type === "files" ? (
          <>
            <div className="files">{byFiles}</div>
            <div className="albums" style={{ display: "none" }}>
              {byAlbums}
            </div>
          </>
        ) : (
          <>
            <div className="albums">{byAlbums}</div>
            <div className="files" style={{ display: "none" }}>
              {byFiles}
            </div>
          </>
        )}
        {type === "files"
          ? filesLoading && <div className="item itemloading">...Loading</div>
          : null}
        {type === "albums"
          ? albumsLoading && <div className="item itemloading">...Loading</div>
          : null}
      </div>
    </>
  );
};

export default InfiniteList;
