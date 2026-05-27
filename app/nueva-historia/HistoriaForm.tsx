"use client";

import React, { useState, useEffect, useActionState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Card from '@/components/Card';
import { createHistoriaClinica, FormState } from '@/app/actions/historia';

interface Paciente {
  id: string;
  nombre: string;
  apellido: string;
  fechaNacimiento: Date;
  genero: string;
  tipoSangre: string | null;
  alergias: string | null;
  antecedentes: string | null;
  contacto: string | null;
}

interface Doctor {
  id: string;
  nombre: string;
}

interface HistoriaFormProps {
  pacientes: Paciente[];
  doctores: Doctor[];
}

export default function HistoriaForm({ pacientes, doctores }: HistoriaFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const patientIdParam = searchParams.get('patientId');

  const [state, formAction, isPending] = useActionState(createHistoriaClinica, {
    errors: {},
    message: null,
  } as FormState);

  // Estados para controlar los campos deshabilitados (Datos Demográficos)
  const [selectedPatientId, setSelectedPatientId] = useState('new');
  
  const [nombre, setNombre] = useState('');
  const [apellido, setApellido] = useState('');
  const [fechaNacimiento, setFechaNacimiento] = useState('');
  const [genero, setGenero] = useState('MASCULINO');
  const [tipoSangre, setTipoSangre] = useState('O+');
  const [contacto, setContacto] = useState('');
  const [alergias, setAlergias] = useState('');
  const [antecedentes, setAntecedentes] = useState('');

  // Cargar datos si se pasa un patientId por la URL o se selecciona uno
  useEffect(() => {
    const targetId = patientIdParam || selectedPatientId;
    if (targetId && targetId !== 'new') {
      const patient = pacientes.find(p => p.id === targetId);
      if (patient) {
        setSelectedPatientId(patient.id);
        setNombre(patient.nombre);
        setApellido(patient.apellido);
        setFechaNacimiento(new Date(patient.fechaNacimiento).toISOString().split('T')[0]);
        setGenero(patient.genero);
        setTipoSangre(patient.tipoSangre || 'O+');
        setContacto(patient.contacto || '');
        setAlergias(patient.alergias || '');
        setAntecedentes(patient.antecedentes || '');
      }
    } else {
      setSelectedPatientId('new');
      setNombre('');
      setApellido('');
      setFechaNacimiento('');
      setGenero('MASCULINO');
      setTipoSangre('O+');
      setContacto('');
      setAlergias('');
      setAntecedentes('');
    }
  }, [patientIdParam, selectedPatientId, pacientes]);

  const handlePatientSelectChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedPatientId(e.target.value);
  };

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      
      {state.message && (
        <div style={{ padding: '1rem', backgroundColor: '#fee2e2', color: '#991b1b', borderRadius: '8px', border: '1px solid #f87171' }}>
          <strong>Error: </strong> {state.message}
          {state.errors?._form && <div>{state.errors._form.join(', ')}</div>}
        </div>
      )}

      {/* SECCIÓN 1: Selección o Datos Demográficos */}
      <Card title="Ficha del Paciente" subtitle="Selecciona un paciente existente o registra los datos de uno nuevo">
        
        <div className="form-group" style={{ marginBottom: '1rem' }}>
          <label htmlFor="pacienteId" className="form-label">Paciente Registrado</label>
          <select 
            id="pacienteId"
            name="pacienteId"
            className="form-control"
            value={selectedPatientId}
            onChange={handlePatientSelectChange}
            style={{ fontWeight: 600, color: 'var(--primary-color)' }}
          >
            <option value="new">-- REGISTRAR NUEVO PACIENTE --</option>
            {pacientes.map((p) => (
              <option key={p.id} value={p.id}>{p.nombre} {p.apellido} (ID: {p.id.split('-')[0]})</option>
            ))}
          </select>
          {state.errors?.pacienteId && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.pacienteId.join(', ')}</span>}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="nombre" className="form-label">Nombres <span>*</span></label>
            <input 
              id="nombre"
              name="nombre"
              type="text" 
              className="form-control" 
              placeholder="Ej. Juan Carlos"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              readOnly={selectedPatientId !== 'new'}
            />
            {state.errors?.nombre && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.nombre.join(', ')}</span>}
          </div>
          
          <div className="form-group">
            <label htmlFor="apellido" className="form-label">Apellidos <span>*</span></label>
            <input 
              id="apellido"
              name="apellido"
              type="text" 
              className="form-control" 
              placeholder="Ej. Pérez Gómez"
              value={apellido}
              onChange={(e) => setApellido(e.target.value)}
              readOnly={selectedPatientId !== 'new'}
            />
            {state.errors?.apellido && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.apellido.join(', ')}</span>}
          </div>

          <div className="form-grid-4" style={{ gap: '1.25rem', gridColumn: '1 / -1' }}>
            <div className="form-group">
              <label htmlFor="fechaNacimiento" className="form-label">Fecha Nacimiento <span>*</span></label>
              <input 
                id="fechaNacimiento"
                name="fechaNacimiento"
                type="date" 
                className="form-control" 
                value={fechaNacimiento}
                onChange={(e) => setFechaNacimiento(e.target.value)}
                readOnly={selectedPatientId !== 'new'}
              />
              {state.errors?.fechaNacimiento && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.fechaNacimiento.join(', ')}</span>}
            </div>
            
            <div className="form-group">
              <label htmlFor="genero" className="form-label">Género <span>*</span></label>
              {selectedPatientId !== 'new' ? (
                 <input type="hidden" name="genero" value={genero} />
              ) : null}
              <select 
                id="genero"
                name="genero"
                className="form-control"
                value={genero}
                onChange={(e) => setGenero(e.target.value)}
                disabled={selectedPatientId !== 'new'}
              >
                <option value="MASCULINO">Masculino</option>
                <option value="FEMENINO">Femenino</option>
                <option value="OTRO">Otro</option>
              </select>
              {state.errors?.genero && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.genero.join(', ')}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="tipoSangre" className="form-label">Grupo Sanguíneo</label>
              {selectedPatientId !== 'new' ? (
                 <input type="hidden" name="tipoSangre" value={tipoSangre} />
              ) : null}
              <select 
                id="tipoSangre"
                name="tipoSangre"
                className="form-control"
                value={tipoSangre}
                onChange={(e) => setTipoSangre(e.target.value)}
                disabled={selectedPatientId !== 'new'}
              >
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
              {state.errors?.tipoSangre && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.tipoSangre.join(', ')}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="contacto" className="form-label">Contacto / Teléfono</label>
              <input 
                id="contacto"
                name="contacto"
                type="text" 
                className="form-control" 
                placeholder="Ej. +51 987654321"
                value={contacto}
                onChange={(e) => setContacto(e.target.value)}
              />
              {state.errors?.contacto && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.contacto.join(', ')}</span>}
            </div>
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: '1rem' }}>
          <div className="form-group">
            <label htmlFor="alergias" className="form-label">Alergias Conocidas</label>
            <textarea 
              id="alergias"
              name="alergias"
              className="form-control" 
              placeholder="Ej. Alergia a la penicilina, aines, polen..."
              value={alergias}
              onChange={(e) => setAlergias(e.target.value)}
              readOnly={selectedPatientId !== 'new'}
            />
            {state.errors?.alergias && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.alergias.join(', ')}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="antecedentes" className="form-label">Antecedentes Médicos</label>
            <textarea 
              id="antecedentes"
              name="antecedentes"
              className="form-control" 
              placeholder="Ej. Hipertensión hereditaria, cirugías previas, asma..."
              value={antecedentes}
              onChange={(e) => setAntecedentes(e.target.value)}
              readOnly={selectedPatientId !== 'new'}
            />
            {state.errors?.antecedentes && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.antecedentes.join(', ')}</span>}
          </div>
        </div>
      </Card>

      {/* SECCIÓN 2: Signos Vitales */}
      <Card title="Examen Físico e Indicadores" subtitle="Registro de signos vitales actuales medidos en triaje/consulta">
        <div className="form-grid-4">
          <div className="form-group">
            <label htmlFor="presionArt" className="form-label">Presión Arterial <span>*</span></label>
            <input 
              id="presionArt"
              name="presionArt"
              type="text" 
              className="form-control" 
              placeholder="Ej. 120/80"
            />
            {state.errors?.presionArt && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.presionArt.join(', ')}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="pulso" className="form-label">Frec. Cardíaca (Pulso) <span>*</span></label>
            <input 
              id="pulso"
              name="pulso"
              type="number" 
              className="form-control" 
              placeholder="Ej. 72 lpm"
            />
            {state.errors?.pulso && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.pulso.join(', ')}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="temperatura" className="form-label">Temperatura Corporal <span>*</span></label>
            <input 
              id="temperatura"
              name="temperatura"
              type="number" 
              step="0.1" 
              className="form-control" 
              placeholder="Ej. 36.5 °C"
            />
            {state.errors?.temperatura && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.temperatura.join(', ')}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="peso" className="form-label">Peso Corporal (kg) <span>*</span></label>
            <input 
              id="peso"
              name="peso"
              type="number" 
              step="0.1" 
              className="form-control" 
              placeholder="Ej. 75.4 kg"
            />
            {state.errors?.peso && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.peso.join(', ')}</span>}
          </div>
        </div>
      </Card>

      {/* SECCIÓN 3: Detalles de la Consulta */}
      <Card title="Evolución y Diagnóstico" subtitle="Motivo de la consulta actual, diagnóstico médico y plan de tratamiento">
        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="motivo" className="form-label">Motivo de Consulta <span>*</span></label>
          <input 
            id="motivo"
            name="motivo"
            type="text" 
            className="form-control" 
            placeholder="Ej. Dolor lumbar persistente / Control de tratamiento"
          />
          {state.errors?.motivo && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.motivo.join(', ')}</span>}
        </div>

        <div className="form-group" style={{ marginBottom: '1.25rem' }}>
          <label htmlFor="sintomas" className="form-label">Anamnesis / Síntomas Descritos <span>*</span></label>
          <textarea 
            id="sintomas"
            name="sintomas"
            className="form-control" 
            placeholder="Describa a detalle lo que el paciente relata y examen físico inicial..."
            style={{ minHeight: '100px' }}
          />
          {state.errors?.sintomas && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.sintomas.join(', ')}</span>}
        </div>

        <div className="form-grid">
          <div className="form-group">
            <label htmlFor="diagnostico" className="form-label">Diagnóstico Clínico <span>*</span></label>
            <textarea 
              id="diagnostico"
              name="diagnostico"
              className="form-control" 
              placeholder="Diagnóstico de ingreso o definitivo..."
              style={{ minHeight: '120px' }}
            />
            {state.errors?.diagnostico && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.diagnostico.join(', ')}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="tratamiento" className="form-label">Plan de Tratamiento / Receta <span>*</span></label>
            <textarea 
              id="tratamiento"
              name="tratamiento"
              className="form-control" 
              placeholder="Fármacos (dosis, intervalo, duración), exámenes solicitados, reposo..."
              style={{ minHeight: '120px' }}
            />
            {state.errors?.tratamiento && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.tratamiento.join(', ')}</span>}
          </div>
        </div>

        <div className="form-grid" style={{ marginTop: '1.25rem' }}>
          <div className="form-group">
            <label htmlFor="doctorId" className="form-label">Médico Tratante <span>*</span></label>
            <select 
              id="doctorId"
              name="doctorId"
              className="form-control"
            >
              <option value="">-- SELECCIONE MÉDICO --</option>
              {doctores.map((doc) => (
                <option key={doc.id} value={doc.id}>{doc.nombre}</option>
              ))}
            </select>
            {state.errors?.doctorId && <span style={{ color: 'red', fontSize: '0.85rem' }}>{state.errors.doctorId.join(', ')}</span>}
          </div>
        </div>
      </Card>

      {/* Botones de Envío */}
      <div className="form-actions">
        <button 
          type="button" 
          className="btn btn-secondary" 
          onClick={() => {
            if(confirm('¿Seguro que deseas cancelar el registro? Perderás los cambios no guardados.')) {
              router.push('/');
            }
          }}
          disabled={isPending}
        >
          Cancelar
        </button>
        <button 
          type="submit" 
          className="btn btn-primary"
          style={{ padding: '0.6rem 2rem' }}
          disabled={isPending}
        >
          {isPending ? "Guardando..." : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '6px' }}><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
              Guardar Historia Clínica
            </>
          )}
        </button>
      </div>

    </form>
  );
}
