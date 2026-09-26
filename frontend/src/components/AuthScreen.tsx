import React, { useState } from 'react';
import { Leaf, Lock, User, ArrowRight } from 'lucide-react';
import { apiClient } from '../services/api';

interface AuthScreenProps {
  onLoginSuccess: (token: string, username: string) => void;
}

export const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginSuccess }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (isRegistering && password !== confirmPassword) {
      setError('Las contraseñas no coinciden.');
      return;
    }

    setLoading(true);

    try {
      if (isRegistering) {
        await apiClient.post('/api/auth/register', {
          username,
          password,
          confirm_password: confirmPassword,
        });
        setIsRegistering(false);
        setError('¡Registro exitoso! Por favor, inicia sesión.');
        setPassword('');
        setConfirmPassword('');
      } else {
        const response = await apiClient.post('/api/auth/login', {
          username,
          password,
        });
        const { access_token, username: user } = response.data;
        
        localStorage.setItem('token_autenticacion', access_token);
        onLoginSuccess(access_token, user);
      }
    } catch (err: any) {
      console.error(err);
      setError(
        err.response?.data?.detail || 
        'Ocurrió un error al procesar la solicitud. Verifica tus datos.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#eaf1e7] flex items-center justify-center p-4">
      <div className="bg-white max-w-md w-full rounded-[32px] border border-[#d3e2ce] shadow-xl p-8 space-y-6 animate-fadeIn">
        
        <div className="text-center space-y-2">
          <div className="w-14 h-14 bg-[#e2f3df] text-[#3b5731] rounded-2xl mx-auto flex items-center justify-center shadow-2xs border border-[#c3e3ba]">
            <Leaf className="w-7 h-7" />
          </div>
          <h1 className="font-botanical text-[24px] font-bold text-[#22371c]">
            Sistema Experto Botánico
          </h1>
          <p className="text-[13px] text-[#556c4e]">
            {isRegistering 
              ? 'Crea tu cuenta para gestionar tu jardín inteligente.' 
              : 'Inicia sesión para acceder a tu inventario y telemetría.'}
          </p>
        </div>

        {error && (
          <div className={`p-3 rounded-2xl text-[12px] font-medium border ${
            error.includes('exitoso') 
              ? 'bg-[#ecfdf5] text-[#065f46] border-[#a7f3d0]' 
              : 'bg-[#fee2e2] text-[#991b1b] border-[#fca5a5]'
          }`}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[11.5px] font-bold uppercase tracking-wider text-[#556d4e]">
              Usuario
            </label>
            <div className="relative">
              <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73886e]" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Ej. botanico_admin"
                className="w-full bg-[#f9faf7] pl-10 pr-4 py-2.5 text-[13px] rounded-2xl border border-[#dce7d5] focus:outline-none focus:border-[#526b4a] text-[#22331d]"
              />
            </div>
          </div>

          <div className="space-y-1">
            <label className="text-[11.5px] font-bold uppercase tracking-wider text-[#556d4e]">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73886e]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#f9faf7] pl-10 pr-4 py-2.5 text-[13px] rounded-2xl border border-[#dce7d5] focus:outline-none focus:border-[#526b4a] text-[#22331d]"
              />
            </div>
          </div>

          {isRegistering && (
            <div className="space-y-1">
              <label className="text-[11.5px] font-bold uppercase tracking-wider text-[#556d4e]">
                Confirmar Contraseña
              </label>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#73886e]" />
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-[#f9faf7] pl-10 pr-4 py-2.5 text-[13px] rounded-2xl border border-[#dce7d5] focus:outline-none focus:border-[#526b4a] text-[#22331d]"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#526b4a] hover:bg-[#43573c] text-white py-3 rounded-2xl text-[13px] font-bold shadow-2xs transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-95 disabled:opacity-50"
          >
            <span>{isRegistering ? 'Registrar Cuenta' : 'Iniciar Sesión'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="text-center pt-2 border-t border-[#edf3e8]">
          <button
            type="button"
            onClick={() => {
              setIsRegistering(!isRegistering);
              setError(null);
            }}
            className="text-[12.5px] text-[#526b4a] hover:text-[#2d3e26] font-semibold cursor-pointer"
          >
            {isRegistering
              ? '¿Ya tienes una cuenta? Inicia sesión'
              : '¿No tienes cuenta? Regístrate aquí'}
          </button>
        </div>

      </div>
    </div>
  );
};