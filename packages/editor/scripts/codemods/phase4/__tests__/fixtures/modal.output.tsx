import { Modal } from "@/shared/ui/Modal";
export function Demo() {
  return (
    <Modal isOpen={true} onClose={() => {}} title="Demo">
      <p>Body content</p>
    </Modal>
  );
}
