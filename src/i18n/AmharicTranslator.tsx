/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * Lossless DOM Translation Bridge for Full-App Amharic (አማርኛ) Support
 * Ensures dynamic seed content, tables, modals, notifications, and 27 modules
 * switch seamlessly between English and Amharic while restoring exact originals.
 */

import React, { useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { translateToAmharic } from './amharicDictionary';

const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'KBD', 'SVG']);
const TRANSLATABLE_ATTRS = ['placeholder', 'title', 'aria-label'] as const;

type AttrName = (typeof TRANSLATABLE_ATTRS)[number];

function isSkippedElement(el: Element | null): boolean {
  let curr: Element | null = el;
  while (curr) {
    if (SKIP_TAGS.has(curr.tagName)) return true;
    if (curr.hasAttribute('data-no-translate')) return true;
    curr = curr.parentElement;
  }
  return false;
}

export const AmharicDomBridge: React.FC = () => {
  const { language } = useAuth();
  const originalTextMapRef = useRef(new WeakMap<Text, string>());
  const lastAppliedTextMapRef = useRef(new WeakMap<Text, string>());
  const originalAttrMapRef = useRef(new WeakMap<Element, Partial<Record<AttrName, string>>>());
  const lastAppliedAttrMapRef = useRef(new WeakMap<Element, Partial<Record<AttrName, string>>>());

  useEffect(() => {
    const root = document.getElementById('root');
    if (!root) return;

    const originalTextMap = originalTextMapRef.current;
    const lastAppliedTextMap = lastAppliedTextMapRef.current;
    const originalAttrMap = originalAttrMapRef.current;
    const lastAppliedAttrMap = lastAppliedAttrMapRef.current;

    const processTextNode = (node: Text, targetLang: 'en' | 'am') => {
      if (isSkippedElement(node.parentElement)) return;
      const currentVal = node.nodeValue ?? '';
      if (!currentVal.trim()) return;

      if (targetLang === 'am') {
        const lastApplied = lastAppliedTextMap.get(node);
        // If React updated this node with fresh text since our last translation, capture the new English baseline
        if (lastApplied !== undefined && currentVal !== lastApplied) {
          if (!/[\u1200-\u137F]/.test(currentVal)) {
            originalTextMap.set(node, currentVal);
          }
        } else if (!originalTextMap.has(node)) {
          originalTextMap.set(node, currentVal);
        }

        const sourceEnglish = originalTextMap.get(node) ?? currentVal;
        const translated = translateToAmharic(sourceEnglish);
        if (translated !== currentVal) {
          lastAppliedTextMap.set(node, translated);
          node.nodeValue = translated;
        }
      } else {
        const original = originalTextMap.get(node);
        const lastApplied = lastAppliedTextMap.get(node);
        if (original !== undefined && lastApplied !== undefined && currentVal === lastApplied && currentVal !== original) {
          node.nodeValue = original;
        }
        lastAppliedTextMap.delete(node);
      }
    };

    const processElementAttrs = (el: Element, targetLang: 'en' | 'am') => {
      if (isSkippedElement(el)) return;
      for (const attr of TRANSLATABLE_ATTRS) {
        if (!el.hasAttribute(attr)) continue;
        const currentVal = el.getAttribute(attr);
        if (!currentVal || !currentVal.trim()) continue;

        let origStore = originalAttrMap.get(el);
        let appliedStore = lastAppliedAttrMap.get(el);

        if (targetLang === 'am') {
          if (!origStore) {
            origStore = {};
            originalAttrMap.set(el, origStore);
          }
          if (!appliedStore) {
            appliedStore = {};
            lastAppliedAttrMap.set(el, appliedStore);
          }

          if (appliedStore[attr] !== undefined && currentVal !== appliedStore[attr]) {
            if (!/[\u1200-\u137F]/.test(currentVal)) {
              origStore[attr] = currentVal;
            }
          } else if (origStore[attr] === undefined) {
            origStore[attr] = currentVal;
          }

          const sourceEnglish = origStore[attr] ?? currentVal;
          const translated = translateToAmharic(sourceEnglish);
          if (translated !== currentVal) {
            appliedStore[attr] = translated;
            el.setAttribute(attr, translated);
          }
        } else if (origStore && origStore[attr] !== undefined && appliedStore && appliedStore[attr] !== undefined) {
          if (currentVal === appliedStore[attr] && currentVal !== origStore[attr]) {
            el.setAttribute(attr, origStore[attr]!);
          }
          delete appliedStore[attr];
        }
      }
    };

    const translateSubtree = (targetNode: Node, targetLang: 'en' | 'am') => {
      if (targetNode.nodeType === Node.TEXT_NODE) {
        processTextNode(targetNode as Text, targetLang);
        return;
      }
      if (targetNode.nodeType !== Node.ELEMENT_NODE) return;

      const rootEl = targetNode as Element;
      processElementAttrs(rootEl, targetLang);

      const walker = document.createTreeWalker(
        rootEl,
        NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
      );
      let current: Node | null = walker.nextNode();
      while (current) {
        if (current.nodeType === Node.TEXT_NODE) {
          processTextNode(current as Text, targetLang);
        } else if (current.nodeType === Node.ELEMENT_NODE) {
          processElementAttrs(current as Element, targetLang);
        }
        current = walker.nextNode();
      }
    };

    let observer: MutationObserver | null = null;
    const observeRoot = () => {
      if (!observer) return;
      observer.observe(root, {
        childList: true,
        subtree: true,
        characterData: true,
        attributes: true,
        attributeFilter: ['placeholder', 'title', 'aria-label'],
      });
    };

    // Initial pass for current language
    translateSubtree(root, language);

    if (language === 'am') {
      observer = new MutationObserver((mutations) => {
        observer?.disconnect();
        try {
          for (const m of mutations) {
            if (m.type === 'characterData') {
              processTextNode(m.target as Text, 'am');
            } else if (m.type === 'attributes' && m.target instanceof Element) {
              processElementAttrs(m.target, 'am');
            } else if (m.type === 'childList') {
              m.addedNodes.forEach((n) => translateSubtree(n, 'am'));
            }
          }
        } finally {
          observeRoot();
        }
      });
      observeRoot();
    }

    return () => {
      observer?.disconnect();
    };
  }, [language]);

  return null;
};
