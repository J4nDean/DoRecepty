import { useNavigate } from 'react-router-dom';
import { ChevronRight, AlertTriangle } from 'lucide-react';
import type { Prescription } from '../types';
import { statusMetaOf, daysUntilExpiry, isExpiringSoon } from '../utils';
import { useMetadata } from '../MetadataContext';

// Poprawiony Barcode - wycentrowany, z reprezentacją liczbową
const BarcodeMock = ({ number }: { number: string }) => {
  // Generowanie mocka 44 cyfr na podstawie numeru recepty
  const fullBarcodeNumber = `100101${number}316993141033672942435380593264361040`.slice(0, 44);
  
  return (
    <div className="flex flex-col items-center w-full">
      <div className="flex h-10 w-full max-w-[240px] items-stretch justify-center gap-[1px] opacity-50 group-hover:opacity-70 transition-opacity overflow-hidden">
        {[...Array(60)].map((_, i) => (
          <div
            key={i}
            className="bg-black shrink-0"
            style={{
              width: i % 7 === 0 ? '3px' : i % 3 === 0 ? '2px' : '1px',
            }}
          />
        ))}
      </div>
      <p className="text-[8px] text-neutral-600 font-mono tracking-[0.1em] mt-1 leading-none">
        {fullBarcodeNumber}
      </p>
    </div>
  );
};

export const PrescriptionCard = ({ prescription }: { prescription: Prescription }) => {
  const navigate = useNavigate();
  const { metadata, labelOf } = useMetadata();

  const meta = statusMetaOf(prescription.status);
  const expiringSoon = isExpiringSoon(prescription.status, prescription.expiryDate);
  const days = expiringSoon ? daysUntilExpiry(prescription.expiryDate) : 0;
  const drugs = prescription.drugs;

  return (
    <article
      onClick={() => navigate(`/recepty/${prescription.id}`)}
      className={`group relative overflow-hidden bg-white rounded-xl border cursor-pointer transition-all hover:shadow-md w-full flex flex-col ${
        expiringSoon 
          ? 'border-amber-400 ring-4 ring-amber-400/30 shadow-amber-100' 
          : 'border-neutral-200 hover:border-neutral-300'
      }`}
      aria-label={`Recepta ${prescription.number}`}
    >
      <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] [background-size:10px_10px] opacity-[0.06]" />

      <div className="relative p-5 flex flex-col flex-1">
        {/* Góra: Kod kreskowy i ID - POWIĘKSZONE */}
        <div className="mb-5 flex flex-col items-center w-full text-center">
          <BarcodeMock number={prescription.number} />
          <p className="text-[10px] text-neutral-400 font-mono font-bold tracking-[0.3em] mt-2 uppercase opacity-70">
            ID:{prescription.number}
          </p>
        </div>

        {/* Środek: Kod dostępu - POWIĘKSZONY */}
        <div className="flex flex-col items-center justify-center py-4 border-y border-dashed border-neutral-100">
          <p className="text-[11px] text-neutral-400 uppercase font-bold tracking-widest mb-1.5">Kod dostępu</p>
          <div className="relative px-8 py-2.5 bg-white/50 rounded">
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-brand-600/60" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-brand-600/60" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-brand-600/60" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-brand-600/60" />
            <span className="text-4xl font-mono font-bold text-neutral-900 tracking-[0.2em]">
              {prescription.number}
            </span>
          </div>
        </div>

        {/* Lista leków - WIĘKSZE CZCIONKI */}
        <div className="mt-5 space-y-2 flex-1">
          {drugs.map((drug, i) => (
            <div key={i} className="relative border border-neutral-100 p-4 bg-neutral-50/50 rounded-lg flex justify-between gap-3 group-hover:bg-neutral-50/80 transition-colors w-full shadow-sm">
              <div className="min-w-0">
                <p className="text-[15px] font-black text-neutral-900 leading-tight uppercase mb-1">{drug.name}</p>
                <p className="text-[11px] text-neutral-500 font-medium italic opacity-90">D.S. {drug.dosage}</p>
              </div>
              <div className="flex flex-col items-center justify-center border-l border-neutral-200 pl-3 text-[11px] font-black text-neutral-200 shrink-0">
                <span className="leading-none">R</span>
                <span className="mt-1.5 leading-none text-brand-600/40">S</span>
              </div>
            </div>
          ))}
        </div>

        {/* Dół: Status - POWIĘKSZONY */}
        <div className="mt-5 pt-4 border-t border-neutral-50 flex items-center justify-between">
          <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[11px] font-black tracking-tighter ring-1 ${meta.chip} opacity-90 whitespace-nowrap`}>
            {labelOf(metadata.prescriptionStatuses, prescription.status)}
          </span>

          {expiringSoon ? (
            <span className="text-[11px] font-bold text-amber-600 flex items-center gap-1.5 animate-pulse">
              <AlertTriangle size={14} />
              {days === 0 ? 'DZIŚ' : `${days} DNI`}
            </span>
          ) : (
            <div className="flex items-center gap-1 text-brand-600 font-bold text-[11px] tracking-tight">
              SZCZEGÓŁY <ChevronRight size={14} />
            </div>
          )}
        </div>
      </div>
    </article>
  );
};
