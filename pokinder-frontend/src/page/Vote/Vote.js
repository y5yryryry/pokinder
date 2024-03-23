import { motion } from "framer-motion";
import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery } from "react-query";

import { addVote, drawFusions } from "../../api/pokinder";

import VoteButton from "../../component/atom/VoteButton/VoteButton";
import Page from "../../component/organism/Page/Page";

import LoadingVoteCard from "./LoadingVoteCard";
import styles from "./Vote.module.css";
import VoteCard from "./VoteCard";

function Vote() {
  // The number of fusions fetched from the API.
  const AMOUNT_FETCH_NEW_FUSIONS = 30;
  // The number of fusions left before trigerring the API.
  const TRIGGER_FETCH_NEW_FUSIONS = 20;
  // The number of fusions rendered.
  const CACHED_FUSIONS = 6;
  // The duration of the swipe animation.
  const SWIPE_DURATION = 0.2;
  // The space between two cards.
  const CARD_SPACE = 290 + 16;
  // The time to wait between two votes.
  const MILLISECONDS_BETWEEN_VOTES = 250;

  const { t } = useTranslation();

  const [lastVoteTime, setLastVoteTime] = useState(new Date().getTime());
  const [voteType, setVoteType] = useState(0);
  const [absoluteIndex, setAbsoluteIndex] = useState(CACHED_FUSIONS - 1);
  const [relativeIndex, setRelativeIndex] = useState(0);
  const [carouselFusions, setCarouselFusions] = useState([]);
  const fusions = useRef([]);

  const persistKeyDate = "pokinderVoteDate";
  const persistKeyFusions = "pokinderVoteFusions";
  const persistKeyCarouselFusions = "pokinderVoteCarousselFusions";

  function setAndPersistFusions(newFusions) {
    fusions.current = newFusions;
    localStorage.setItem(persistKeyFusions, JSON.stringify(newFusions));
    localStorage.setItem(persistKeyDate, new Date().getTime());
  }

  function setAndPersistCarouselFusions(newCarouselFusions) {
    setCarouselFusions(newCarouselFusions);
    localStorage.setItem(persistKeyCarouselFusions, JSON.stringify(newCarouselFusions));
  }

  function shouldUsePersistedFusions() {
    const maybeRefreshDate = localStorage.getItem(persistKeyDate);

    if (maybeRefreshDate === null) return false;

    var oneMonthInMilliseconds = 31 * 24 * 60 * 60 * 1000;
    var currentTimestamp = Date.now();

    return currentTimestamp - maybeRefreshDate < oneMonthInMilliseconds;
  }

  // Init the carousel when the component is first rendered.
  function initCarouselFusions(fusions) {
    var queue = new Array(CACHED_FUSIONS - 1).fill({});

    for (const fusion of fusions.slice(0, CACHED_FUSIONS)) {
      queue.push(fusion);
    }

    return queue;
  }

  function getPersistedFusions() {
    setCarouselFusions(JSON.parse(localStorage.getItem(persistKeyCarouselFusions)));
    fusions.current = JSON.parse(localStorage.getItem(persistKeyFusions));
  }

  async function drawNewFusions() {
    // Call the Pokinder API to fecth more fusions.
    const data = await drawFusions(AMOUNT_FETCH_NEW_FUSIONS);
    const newFusions = data || [];

    if (newFusions.length > 0) {
      // First time, we fill the carousel with both data and empty objects.
      if (carouselFusions.length === 0) {
        const newCarouselFusions = initCarouselFusions(newFusions);

        setAndPersistCarouselFusions(newCarouselFusions);
        setAndPersistFusions(newFusions.slice(CACHED_FUSIONS, newFusions.length));
      }
      // We fetched new sprite, should fill the fusions but not the carousel.
      else {
        // We need to slice the first fusion moved to the carousel in onVote.
        setAndPersistFusions([...fusions.current, ...newFusions]);
      }
    }
  }

  async function getFusions() {
    const persistKeyFusionsExists = localStorage.getItem(persistKeyFusions) !== null;
    const persistKeyCarouselFusionsExists =
      localStorage.getItem(persistKeyCarouselFusions) !== null;

    if (persistKeyFusionsExists && persistKeyCarouselFusionsExists && shouldUsePersistedFusions())
      getPersistedFusions();
    else await drawNewFusions();
  }

  // Apply vote when animation is complete.
  async function onVote() {
    const previousFusion = carouselFusions[CACHED_FUSIONS - 1];

    if (fusions.current.length < TRIGGER_FETCH_NEW_FUSIONS && !isFetching) {
      refetchFusions();
    }

    setAndPersistFusions(fusions.current.slice(1));
    setAndPersistCarouselFusions([...carouselFusions.slice(1), fusions.current[0]]);
    setRelativeIndex(relativeIndex + 1);

    storeVote({ fusionId: previousFusion.id, voteType: voteType });
  }

  // Swipe the card and select the correct vote type.
  function vote(newVoteType) {
    const now = new Date().getTime();
    if (now - lastVoteTime > MILLISECONDS_BETWEEN_VOTES) {
      setLastVoteTime(new Date().getTime());
      setVoteType(newVoteType);
      setAbsoluteIndex(absoluteIndex + 1);
      return true;
    } else {
      return false;
    }
  }

  const {
    refetch: refetchFusions,
    isFetching,
    isLoading,
    isError,
  } = useQuery(["fusions"], getFusions, {
    staleTime: 60 * 60 * 1000,
    cacheTime: 0,
  });

  const { mutate: storeVote } = useMutation(async ({ fusionId, voteType }) => {
    addVote(fusionId, voteType);
  });

  const transition = {
    duration: SWIPE_DURATION,
    ease: "easeInOut",
  };

  // Animated offset to move cards.
  const absoluteOffset = (absoluteIndex - CACHED_FUSIONS + 1) * CARD_SPACE;
  // Non animated offest to move cards back during unstacking.
  const relativeOffset = -1 * relativeIndex * CARD_SPACE;

  function renderContent() {
    if (isError) {
      return <p>{t("The API is down for the moment, sorry for the inconvenience.")}</p>;
    }

    if (isLoading) {
      return (
        <div className={`${styles.container} ${styles.loading}`}>
          <div className={styles.votes}>
            {Array.from({ length: CACHED_FUSIONS - 1 }, (_, key) => (
              <LoadingVoteCard hidden key={key} />
            ))}
            <LoadingVoteCard hasFocus />
            {Array.from({ length: CACHED_FUSIONS - 1 }, (_, key) => (
              <LoadingVoteCard key={key} />
            ))}
          </div>
          <div className={styles.buttons}>
            <VoteButton variant="downvote" disabled />
            <VoteButton variant="favorite" disabled />
            <VoteButton variant="upvote" disabled />
          </div>
        </div>
      );
    }

    return (
      <div className={styles.container}>
        <div style={{ transform: `translateX(${relativeOffset}px)` }}>
          <motion.div
            initial={false}
            animate={{ x: absoluteOffset }}
            transition={transition}
            className={styles.votes}
            onAnimationComplete={onVote}
          >
            {carouselFusions.map((fusion, key) => (
              <VoteCard
                key={fusion.path || key}
                fusion={fusion}
                transition={transition}
                hasFocus={fusion.path === carouselFusions[absoluteIndex - relativeIndex]?.path}
              />
            ))}
          </motion.div>
        </div>
        <div className={styles.buttons}>
          <VoteButton variant="downvote" onClick={() => vote(1)} />
          <VoteButton variant="favorite" onClick={() => vote(2)} />
          <VoteButton variant="upvote" onClick={() => vote(0)} />
        </div>
      </div>
    );
  }

  return <Page>{renderContent()}</Page>;
}

export default Vote;
