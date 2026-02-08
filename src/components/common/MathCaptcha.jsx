import React, { useState, useEffect } from 'react';
import { RefreshCw } from 'lucide-react';
import { Input } from '@/components/ui/Input';

export const MathCaptcha = ({ onValidate }) => {
    const [problem, setProblem] = useState({ a: 0, b: 0 });
    const [userAnswer, setUserAnswer] = useState('');

    const generateProblem = () => {
        const a = Math.floor(Math.random() * 10) + 1;
        const b = Math.floor(Math.random() * 10) + 1;
        setProblem({ a, b });
        setUserAnswer('');
        onValidate(false); // Reset validation
    };

    useEffect(() => {
        generateProblem();
    }, []);

    const handleChange = (e) => {
        const val = e.target.value;
        setUserAnswer(val);
        const correct = parseInt(val) === (problem.a + problem.b);
        onValidate(correct);
    };

    return (
        <div className="p-4 bg-gray-50 rounded-xl border border-gray-100 space-y-3">
            <div className="flex items-center justify-between">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">
                    Drošības pārbaude
                </p>
                <button
                    type="button"
                    onClick={generateProblem}
                    className="text-scafoteam-navy hover:rotate-180 transition-transform duration-500"
                >
                    <RefreshCw className="w-3 h-3" />
                </button>
            </div>
            <div className="flex items-center gap-4">
                <div className="bg-white px-4 py-2 rounded-lg border border-gray-200 font-black text-scafoteam-navy">
                    {problem.a} + {problem.b} = ?
                </div>
                <Input
                    type="number"
                    value={userAnswer}
                    onChange={handleChange}
                    className="h-10 text-center font-bold"
                    placeholder="Atbilde"
                />
            </div>
        </div>
    );
};
