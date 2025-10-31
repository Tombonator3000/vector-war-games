import { useState, useCallback, ReactNode } from 'react';

/**
 * Modal content can be a string, ReactNode, or function returning ReactNode
 */
export type ModalContentValue = string | ReactNode | (() => ReactNode);

/**
 * Modal state interface
 */
export interface ModalState {
  isOpen: boolean;
  title: string;
  content: ModalContentValue;
}

/**
 * Return type for useModalManager hook
 */
export interface UseModalManagerReturn {
  showModal: boolean;
  modalContent: { title: string; content: ModalContentValue };
  openModal: (title: string, content: ModalContentValue) => void;
  closeModal: () => void;
}

/**
 * useModalManager - Custom hook for managing modal state
 *
 * Provides centralized modal state management with open/close functionality.
 * Supports string, ReactNode, or function content.
 *
 * @returns Modal state and control functions
 *
 * @example
 * ```tsx
 * const { showModal, modalContent, openModal, closeModal } = useModalManager();
 *
 * // Open modal with content
 * openModal('Title', <div>Content</div>);
 *
 * // Open modal with function
 * openModal('Title', () => <MyComponent />);
 *
 * // Close modal
 * closeModal();
 * ```
 */
export function useModalManager(): UseModalManagerReturn {
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState<{ title: string; content: ModalContentValue }>({
    title: '',
    content: '',
  });

  const openModal = useCallback((title: string, content: ModalContentValue) => {
    setModalContent({ title, content });
    setShowModal(true);
  }, []);

  const closeModal = useCallback(() => {
    setShowModal(false);
  }, []);

  return {
    showModal,
    modalContent,
    openModal,
    closeModal,
  };
}
