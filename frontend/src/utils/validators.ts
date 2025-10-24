export const validaCPF = (cpf: string): boolean => {
  cpf = cpf.replace(/[^\d]+/g, '');
  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) return false;
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
  let digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
  digit = (sum * 10) % 11;
  if (digit === 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(10))) return false;
  return true;
};

export const validaRG = (rg: string): boolean => {
  const rgLimpo = rg.replace(/[^\dX]+/gi, '');
  return rgLimpo.length >= 7 && rgLimpo.length <= 9;
};

// Adicione validação de CNPJ se necessário
export const validaCNPJ = (cnpj: string): boolean => {
    const digits = cnpj.replace(/\D/g, '');
    if (digits.length !== 14 || /^(\d)\1+$/.test(digits)) return false;
    // Lógica de validação de CNPJ (mais complexa) pode ser adicionada aqui
    return true;
}