import styles from "./FilterPanel.module.css";

import FilterChoices from "../../molecule/FilterChoices/FilterChoices";

import { FaFilter } from "react-icons/fa6";
import useToggle from "../../../hook/useToggle";
import FilterModal from "./FilterModal";
import { useTranslation } from "react-i18next";

function FilterPanel({ initFilters, currentFilters, setFilters }) {
  const { t } = useTranslation();
  const [showModal, toggleModal] = useToggle();

  return (
    <>
      <div className={styles.container}>
        <FilterChoices
          initFilters={initFilters}
          currentFilters={currentFilters}
          setFilters={setFilters}
        />
        <button className={styles.button} onClick={toggleModal}>
          <FaFilter className={styles.icon} />
          {t("Filter")}
        </button>
      </div>
      <FilterModal
        initFilters={initFilters}
        currentFilters={currentFilters}
        setFilters={setFilters}
        isVisible={showModal}
        onClose={toggleModal}
      />
    </>
  );
}

export default FilterPanel;
