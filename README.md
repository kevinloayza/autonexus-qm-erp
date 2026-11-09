# AutoNexus | Módulo ERP de Gestión de Calidad (QM)

AutoNexus QM es una aplicación full-stack transaccional con arquitectura de microservicios, diseñada bajo los estándares visuales e interactivos de un sistema ERP corporativo (Brutalist UI). 

Este módulo digitaliza el proceso de control de calidad en entornos logísticos e industriales, permitiendo el ingreso, trazabilidad y dictamen técnico de componentes mecánicos para eliminar la dependencia de registros manuales y hojas de cálculo.

## Impacto de Negocio y Casos de Uso
- **Trazabilidad Inmutable:** Seguimiento del ciclo de vida de los materiales (lote, estado, operario y fecha exacta).
- **Control de Cuellos de Botella:** Dashboards en tiempo real que visibilizan la carga de trabajo operativa por inspector y la distribución de estados de calidad.
- **Interoperabilidad:** Exportación instantánea del data grid a CSV para su integración con Power BI, Excel u otros módulos del ERP.
- **Workflow Estricto:** Restricciones de sistema que exigen la documentación obligatoria del "motivo de falla" ante cualquier rechazo de material.

## Stack Tecnológico
La solución está completamente contenerizada para garantizar su portabilidad y escalabilidad en cualquier infraestructura.

* **Frontend:** React, Tailwind CSS (Diseño ERP estático de alta densidad de datos), Recharts, Lucide Icons.
* **Backend:** Node.js, Express (API RESTful).
* **Base de Datos:** MySQL 8.0 (Relacional).
* **DevOps / Infraestructura:** Docker & Docker Compose.

## Arquitectura del Sistema
El sistema se compone de 3 contenedores independientes conectados por una red interna:
1. `db`: Motor MySQL pre-configurado con esquemas de validación y un seed masivo de registros de prueba (2024-2025).
2. `backend`: Servidor API que expone los endpoints transaccionales (CRUD) y procesa los cálculos de las métricas.
3. `frontend`: Cliente web reactivo con diseño industrial, filtros multi-criterio y generación de reportes en el navegador.

### 1. Arquitectura de Microservicios (Contenedores)
mermaid
graph TD
UI[Frontend: React + Tailwind UI] -- "HTTP REST (JSON)" --> API[Backend: Node.js + Express]
API -- "Pool TCP (Puerto 3306)" --> DB[(Base de Datos: MySQL 8.0)]
subgraph Entorno Docker Compose [Orquestación]
        UI
        API
        DB
    end
    
    style UI fill:#2563eb,stroke:#1e40af,stroke-width:2px,color:#fff
    style API fill:#16a34a,stroke:#15803d,stroke-width:2px,color:#fff
    style DB fill:#ea580c,stroke:#c2410c,stroke-width:2px,color:#fff
    ### 2. Máquina de Estados (Flujo de Calidad QM)
    mermaid
stateDiagram-v2
direction LR
[] --> PENDIENTE : Nuevo Ingreso (Almacén)
PENDIENTE --> LIBERADO : Inspección Exitosa
PENDIENTE --> RECHAZADO : Falla Técnica
RECHAZADO --> [] : Documentación Obligatoria (Motivo)
LIBERADO --> [*] : Aprobado a Producción



## Instalación y Despliegue Local

Asegúrate de tener [Docker Desktop](https://www.docker.com/products/docker-desktop/) instalado y ejecutándose en tu máquina.

1. Clona este repositorio:
   ```bash
   git clone [https://github.com/tu-usuario/autonexus-qm-erp.git](https://github.com/tu-usuario/autonexus-qm-erp.git)
   cd autonexus-qm-erp
