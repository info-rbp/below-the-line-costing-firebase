"use client";

let registeredContainer: HTMLElement | null = null;
let customExporter: ((node: HTMLElement | null) => Promise<void>) | null = null;

export function triggerPrint() {
  if (typeof window === "undefined") return;
  window.print();
}

export function registerExportContainer(node: HTMLElement | null) {
  registeredContainer = node;
}

export function registerCustomPdfExporter(exporter: ((node: HTMLElement | null) => Promise<void>) | null) {
  customExporter = exporter;
}

export async function exportExecutiveSummaryPdf() {
  if (customExporter) {
    try {
      await customExporter(registeredContainer);
      return;
    } catch (error) {
      if (process.env.NODE_ENV === "development") {
        console.error("PDF export failed, falling back to print", error);
      }
    }
  }
  triggerPrint();
}
