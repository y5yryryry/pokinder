import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation } from "react-query";
import { toast } from "react-toastify";

import { addReferenceProposal, listReferenceFamilies, listReferences } from "../../../api/pokinder";

import { levenshtein } from "../../../utils/string";
import { getDaenaLink } from "../../../utils/website";

import Button from "../../atom/Button/Button";
import Modal from "../../atom/Modal/Modal";
import Panel from "../../atom/Panel/Panel";
import FutureCreatableSelect from "../../atom/Select/FutureCreatableSelect";
import Sprite from "../../atom/Sprite/Sprite";
import Title from "../../atom/Title/Title";
import styles from "./ReferenceProposalModal.module.css";

function ReferenceProposalModal({ isVisible, onClose, fusion }) {
  const { t } = useTranslation();

  const defaultForm = {
    family: undefined,
    name: undefined,
  };

  const [form, setForm] = useState(defaultForm);

  const setFamily = (family) => setForm({ ...form, family: family, name: undefined });
  const setName = (name) => setForm({ ...form, name: name });

  const { mutate: submit } = useMutation(
    async () => {
      await addReferenceProposal(fusion.id, form.name.label, form.family.label);
    },
    {
      onSuccess: () => {
        toast.success(t("Reference proposal success"));
        setForm(defaultForm);
        onClose();
      },
    },
  );

  function optionify(value) {
    return { value: value.id, label: value.name };
  }

  function isReferenceExists() {
    if (form.family === undefined) return false;
    if (form.name === undefined) return false;

    console.log(form);

    for (const reference of fusion.references) {
      const isSameFamily = levenshtein(reference.family.name, form.family.label) < 3;
      const isSameName = levenshtein(reference.name, form.name.label) < 3;
      if (isSameFamily && isSameName) {
        return true;
      }
    }

    return false;
  }

  function isActionDisabled() {
    if (form.family === undefined) return true;
    if (form.name === undefined) return true;

    return isReferenceExists();
  }

  async function fetchReferences() {
    if (form.family === undefined) return [];
    if (form.family.__isNew__ === true) return [];

    return await listReferences(form.family.value, undefined);
  }

  function renderExistingReferences() {
    if (fusion.references.length === 0) return <></>;

    return (
      <Panel title={t("Existing references")}>
        <ul>
          {fusion.references.map((reference, key) => (
            <li key={key}>{`${reference.family.name} - ${reference.name}`}</li>
          ))}
        </ul>
      </Panel>
    );
  }

  function renderReferenceExists() {
    if (!isReferenceExists()) return <></>;

    return <div className={styles.warning}>{t("Reference proposal warning")}</div>;
  }

  const proposeButtonDisabled = isActionDisabled();

  return (
    <Modal className={styles.container} isVisible={isVisible} onClose={onClose}>
      <div>
        <Title title={t("Reference proposal title")} textAlign="left" />
        <p>{t("Reference proposal description")}</p>
      </div>
      <Panel title={t("Fusion")}>
        <Sprite
          className={styles.sprite}
          filename={fusion.id}
          href={getDaenaLink(fusion.path)}
          size={144}
          type="fusion"
          alt={`Fusion sprite ${fusion.body.name} and ${fusion.head.name}`}
        />
      </Panel>
      {renderExistingReferences()}
      <Panel title={t("Family")}>
        <FutureCreatableSelect
          futureValues={listReferenceFamilies}
          valueToOption={optionify}
          onChange={setFamily}
        />
      </Panel>
      <Panel title={t("Name")}>
        <FutureCreatableSelect
          futureValues={fetchReferences}
          valueToOption={optionify}
          onChange={setName}
          updateKey={form.family} // NOTE: trick to force rerendering when family change.
        />
      </Panel>
      {renderReferenceExists()}
      <div className={styles.buttons}>
        <Button title={t("Cancel")} variant="text" foreground onClick={onClose} />
        <Button
          title={t("Reference proposal action")}
          foreground
          disabled={proposeButtonDisabled}
          onClick={submit}
        />
      </div>
    </Modal>
  );
}

export default ReferenceProposalModal;
