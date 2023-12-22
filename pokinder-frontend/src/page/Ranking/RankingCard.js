import styles from "./RankingCard.module.css";
import Sprite from "../../component/atom/Sprite/Sprite";
import { getName } from "../../utils/pokemon";
import { getDaenaLink } from "../../utils/website";
import { memo } from "react";

const RankingCard = memo(function RankingCard({ ranking }) {
  function getIndicator(rank) {
    switch (rank) {
      case 1:
        return "st";
      case 2:
        return "nd";
      case 3:
        return "rd";
      default:
        if (rank < 1000) {
          return "th";
        } else {
          return "";
        }
    }
  }

  const rank = ranking.rank;
  const indicator = getIndicator(rank);

  function rankNumberAdditionalStyle(rank) {
    const length = rank.toString().length;

    switch (length) {
      case 1:
        return { "font-size": "20px" };
      case 2:
        return { "font-size": "18px" };
      case 3:
        return { "font-size": "14px" };
      default:
        let fontSize = 14 - (length - 3) * 2;
        if (fontSize < 7) {
          fontSize = 7;
        }
        return { "font-size": `${fontSize}px` };
    }
  }

  const rankStyle = rankNumberAdditionalStyle(rank);

  return (
    <a
      href={getDaenaLink(ranking.fusion.path)}
      target="_blank"
      rel="noopener noreferrer"
    >
      <div className={styles.container}>
        <div className={styles.rank}>
          <div className={styles.rank_title}>
            <span style={rankStyle} className={styles.rank_number}>
              {rank}
            </span>
            <span className={styles.rank_indicator}>{indicator}</span>
          </div>
        </div>
        <div className={styles.title}>
          <h2 className={styles.name}>
            {getName(
              ranking.fusion.head.name,
              ranking.fusion.head.name_separator_index,
              ranking.fusion.body.name,
              ranking.fusion.body.name_separator_index
            )}
          </h2>
          <span className={styles.path}>#{ranking.fusion.path}</span>
        </div>
        <div className={styles.data}>
          <h2 className={styles.score}>{ranking.score}%</h2>
          <span className={styles.count}>
            {ranking.count} vote{ranking.count > 1 ? "s" : ""}
          </span>
        </div>
        <Sprite
          className={styles.sprite}
          path={ranking.fusion.path}
          size={144}
          type="fusion"
          alt={`Fusion sprite from ${ranking.fusion.body.name} and ${ranking.fusion.head.name}`}
        />
      </div>
    </a>
  );
});

export default RankingCard;