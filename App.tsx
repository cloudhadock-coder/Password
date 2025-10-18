import React, { useState, useCallback, useEffect } from 'react';
import { OptionsPanel } from './components/OptionsPanel';
import { PasswordDisplay } from './components/CodeBlock';
import { HintDisplay } from './components/HintDisplay';
import { generatePasswordHints } from './services/geminiService';
import type { PasswordOptions, PasswordHints } from './types';

const App: React.FC = () => {
  const [options, setOptions] = useState<PasswordOptions>({
    length: 12,
    includeUppercase: true,
    includeNumbers: true,
    includeSymbols: true,
  });

  const [generatedPassword, setGeneratedPassword] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  
  const [hints, setHints] = useState<PasswordHints | null>(null);
  const [isGeneratingHints, setIsGeneratingHints] = useState<boolean>(false);
  const [hintError, setHintError] = useState<string | null>(null);

  useEffect(() => {
    if (!generatedPassword) {
      setHints(null);
      return;
    }

    const fetchHints = async () => {
      setIsGeneratingHints(true);
      setHintError(null);
      setHints(null);
      try {
        const passwordHints = await generatePasswordHints(generatedPassword);
        setHints(passwordHints);
      } catch (e) {
        setHintError(e instanceof Error ? e.message : 'Ocorreu um erro desconhecido ao gerar dicas.');
      } finally {
        setIsGeneratingHints(false);
      }
    };

    fetchHints();
  }, [generatedPassword]);

  const generatePassword = useCallback((options: PasswordOptions): string => {
      const { length, includeUppercase, includeNumbers, includeSymbols } = options;

      const lowerCaseChars = 'abcdefghijklmnopqrstuvwxyz';
      const upperCaseChars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
      const numberChars = '0123456789';
      const symbolChars = '!@#$%^&*()_+-=[]{}|;:,.<>?';

      let availableChars = lowerCaseChars;
      let guaranteedChars: string[] = [];
      
      guaranteedChars.push(lowerCaseChars[Math.floor(Math.random() * lowerCaseChars.length)]);
      
      if (includeUppercase) guaranteedChars.push(upperCaseChars[Math.floor(Math.random() * upperCaseChars.length)]);
      if (includeNumbers) guaranteedChars.push(numberChars[Math.floor(Math.random() * numberChars.length)]);
      if (includeSymbols) guaranteedChars.push(symbolChars[Math.floor(Math.random() * symbolChars.length)]);
      
      if (guaranteedChars.length > length) {
          setError(`O comprimento deve ser de pelo menos ${guaranteedChars.length} para incluir todos os tipos de caracteres selecionados.`);
          return '';
      }
      
      if (includeUppercase) availableChars += upperCaseChars;
      if (includeNumbers) availableChars += numberChars;
      if (includeSymbols) availableChars += symbolChars;
      
      const remainingLength = length - guaranteedChars.length;
      let passwordChars = [...guaranteedChars];

      const randomValues = new Uint32Array(remainingLength);
      crypto.getRandomValues(randomValues);

      for (let i = 0; i < remainingLength; i++) {
        const randomIndex = randomValues[i] % availableChars.length;
        passwordChars.push(availableChars[randomIndex]);
      }
      
      const shuffledValues = new Uint32Array(passwordChars.length);
      crypto.getRandomValues(shuffledValues);

      for (let i = passwordChars.length - 1; i > 0; i--) {
        const j = shuffledValues[i] % (i + 1);
        [passwordChars[i], passwordChars[j]] = [passwordChars[j], passwordChars[i]];
      }

      return passwordChars.join('');
  }, []);


  const handleGeneratePassword = useCallback(() => {
    setError(null);
    const newPassword = generatePassword(options);
    setGeneratedPassword(newPassword);
  }, [options, generatePassword]);

  const Header = () => (
    <header className="text-center p-4">
      <h1 className="text-4xl font-bold text-cyan-400">
        Gerador de Senhas
      </h1>
      <p className="text-gray-300 mt-2">
        Crie senhas seguras e aleatórias para o seu uso diário.
      </p>
    </header>
  );

  const ErrorDisplay = ({ message }: { message: string }) => (
    <div className="bg-red-900/50 border border-red-700 text-red-300 px-4 py-3 rounded-lg my-4" role="alert">
      <strong className="font-bold">Erro: </strong>
      <span className="block sm:inline">{message}</span>
    </div>
  );

  return (
    <div className="min-h-screen text-white font-sans flex flex-col items-center justify-center py-8 px-4">
      <div className="w-full max-w-2xl">
        <Header />
        <main className="mt-8">
          <div className="bg-gray-900/60 backdrop-blur-md border border-gray-700 p-8 rounded-xl shadow-2xl shadow-cyan-500/20">
            <OptionsPanel options={options} setOptions={setOptions} />
            <button
              onClick={handleGeneratePassword}
              className="w-full mt-8 py-3 px-6 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg shadow-md disabled:bg-gray-600 disabled:cursor-not-allowed transition-all duration-300 ease-in-out transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-cyan-500/50"
            >
             Gerar Senha
            </button>
          </div>
          
          <div className="mt-8">
            <PasswordDisplay password={generatedPassword} />
          </div>

          {(generatedPassword) && (
            <div className="mt-8">
                <HintDisplay 
                    password={generatedPassword}
                    hints={hints}
                    isLoading={isGeneratingHints}
                    error={hintError}
                />
            </div>
          )}

          {error && <div className="mt-4"><ErrorDisplay message={error} /></div>}
        </main>
      </div>
    </div>
  );
};

export default App;
