// frontend/src/utils/formatters.ts

// Formata 12345678901 -> 123.456.789-01
export function formatCPF(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits
    .slice(0, 11)
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Formata 12345678901234 -> 12.345.678/0001-90
export function formatCNPJ(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits
    .slice(0, 14)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1/$2')
    .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

// Formata 123456789 -> 12.345.678-9
export function formatRG(value: string): string {
  const digits = value.replace(/\D/g, '');
  return digits
    .slice(0, 9)
    .replace(/(\d{2})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d)/, '$1.$2')
    .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Formata 2025-10-23 -> 23 de Outubro de 2025
export function formatDate(dateString: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    timeZone: 'UTC' // Garante consistência
  });
}