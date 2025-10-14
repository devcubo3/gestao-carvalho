import type {
  User,
  ContractParty,
  Property,
  Vehicle,
  Credit,
  Development,
  Contract,
  CashTransaction,
  AccountReceivable,
  AccountPayable,
  BankAccount,
} from "./types"

// Utility functions for generating IDs
export const generateContractCode = (id: number): string => `CT-${id.toString().padStart(4, "0")}`
export const generatePropertyCode = (id: number): string => `IMV-${id.toString().padStart(4, "0")}`
export const generateVehicleCode = (id: number): string => `VEI-${id.toString().padStart(4, "0")}`
export const generateCreditCode = (id: number): string => `CRD-${id.toString().padStart(4, "0")}`
export const generateDevelopmentCode = (id: number): string => `EMP-${id.toString().padStart(4, "0")}`

// Mock Users - expandido para mais usuários
export const mockUsers: User[] = [
  {
    id: "1",
    name: "João Silva",
    email: "joao.silva@empresa.com.br",
    role: "admin",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  {
    id: "2",
    name: "Maria Santos",
    email: "maria.santos@empresa.com.br",
    role: "gestor",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: "3",
    name: "Pedro Oliveira",
    email: "pedro.oliveira@empresa.com.br",
    role: "visualizador",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
]

// Mock Contract Parties - expandido para 50+ pessoas e empresas
export const mockParties: ContractParty[] = [
  // Pessoas físicas (30 registros)
  {
    id: "1",
    name: "Carlos Eduardo Mendes",
    type: "pessoa",
    document: "123.456.789-00",
    email: "carlos.mendes@email.com",
    phone: "(11) 99999-1234",
  },
  {
    id: "2",
    name: "Ana Paula Costa",
    type: "pessoa",
    document: "987.654.321-00",
    email: "ana.costa@email.com",
    phone: "(11) 88888-5678",
  },
  {
    id: "3",
    name: "Roberto Silva Santos",
    type: "pessoa",
    document: "456.789.123-45",
    email: "roberto.santos@email.com",
    phone: "(11) 77777-9012",
  },
  {
    id: "4",
    name: "Fernanda Oliveira Lima",
    type: "pessoa",
    document: "789.123.456-78",
    email: "fernanda.lima@email.com",
    phone: "(11) 66666-3456",
  },
  {
    id: "5",
    name: "Marcos Antonio Pereira",
    type: "pessoa",
    document: "321.654.987-01",
    email: "marcos.pereira@email.com",
    phone: "(11) 55555-7890",
  },
  {
    id: "6",
    name: "Juliana Rodrigues Alves",
    type: "pessoa",
    document: "654.987.321-23",
    email: "juliana.alves@email.com",
    phone: "(11) 44444-2345",
  },
  {
    id: "7",
    name: "Ricardo Ferreira Souza",
    type: "pessoa",
    document: "147.258.369-45",
    email: "ricardo.souza@email.com",
    phone: "(11) 33333-6789",
  },
  {
    id: "8",
    name: "Patrícia Martins Costa",
    type: "pessoa",
    document: "258.369.147-67",
    email: "patricia.costa@email.com",
    phone: "(11) 22222-0123",
  },
  {
    id: "9",
    name: "André Luiz Barbosa",
    type: "pessoa",
    document: "369.147.258-89",
    email: "andre.barbosa@email.com",
    phone: "(11) 11111-4567",
  },
  {
    id: "10",
    name: "Camila Santos Ribeiro",
    type: "pessoa",
    document: "741.852.963-12",
    email: "camila.ribeiro@email.com",
    phone: "(11) 99998-8901",
  },
  {
    id: "11",
    name: "Diego Henrique Moura",
    type: "pessoa",
    document: "852.963.741-34",
    email: "diego.moura@email.com",
    phone: "(11) 88887-2345",
  },
  {
    id: "12",
    name: "Larissa Fernandes Silva",
    type: "pessoa",
    document: "963.741.852-56",
    email: "larissa.silva@email.com",
    phone: "(11) 77776-6789",
  },
  {
    id: "13",
    name: "Gustavo Cardoso Lima",
    type: "pessoa",
    document: "159.753.486-78",
    email: "gustavo.lima@email.com",
    phone: "(11) 66665-0123",
  },
  {
    id: "14",
    name: "Vanessa Almeida Santos",
    type: "pessoa",
    document: "753.486.159-90",
    email: "vanessa.santos@email.com",
    phone: "(11) 55554-4567",
  },
  {
    id: "15",
    name: "Bruno César Oliveira",
    type: "pessoa",
    document: "486.159.753-01",
    email: "bruno.oliveira@email.com",
    phone: "(11) 44443-8901",
  },
  {
    id: "16",
    name: "Renata Gomes Pereira",
    type: "pessoa",
    document: "357.951.468-23",
    email: "renata.pereira@email.com",
    phone: "(11) 33332-2345",
  },
  {
    id: "17",
    name: "Felipe Augusto Costa",
    type: "pessoa",
    document: "951.468.357-45",
    email: "felipe.costa@email.com",
    phone: "(11) 22221-6789",
  },
  {
    id: "18",
    name: "Isabela Rocha Martins",
    type: "pessoa",
    document: "468.357.951-67",
    email: "isabela.martins@email.com",
    phone: "(11) 11110-0123",
  },
  {
    id: "19",
    name: "Thiago Mendes Souza",
    type: "pessoa",
    document: "246.810.357-89",
    email: "thiago.souza@email.com",
    phone: "(11) 99997-4567",
  },
  {
    id: "20",
    name: "Priscila Dias Ferreira",
    type: "pessoa",
    document: "810.357.246-01",
    email: "priscila.ferreira@email.com",
    phone: "(11) 88886-8901",
  },
  {
    id: "21",
    name: "Leonardo Silva Barbosa",
    type: "pessoa",
    document: "135.792.468-23",
    email: "leonardo.barbosa@email.com",
    phone: "(11) 77775-2345",
  },
  {
    id: "22",
    name: "Adriana Costa Ribeiro",
    type: "pessoa",
    document: "792.468.135-45",
    email: "adriana.ribeiro@email.com",
    phone: "(11) 66664-6789",
  },
  {
    id: "23",
    name: "Rodrigo Alves Moura",
    type: "pessoa",
    document: "468.135.792-67",
    email: "rodrigo.moura@email.com",
    phone: "(11) 55553-0123",
  },
  {
    id: "24",
    name: "Carla Beatriz Lima",
    type: "pessoa",
    document: "579.246.813-89",
    email: "carla.lima@email.com",
    phone: "(11) 44442-4567",
  },
  {
    id: "25",
    name: "Mateus Henrique Santos",
    type: "pessoa",
    document: "246.813.579-01",
    email: "mateus.santos@email.com",
    phone: "(11) 33331-8901",
  },
  {
    id: "26",
    name: "Natália Fernandes Costa",
    type: "pessoa",
    document: "813.579.246-23",
    email: "natalia.costa@email.com",
    phone: "(11) 22220-2345",
  },
  {
    id: "27",
    name: "Gabriel Rodrigues Silva",
    type: "pessoa",
    document: "680.357.924-45",
    email: "gabriel.silva@email.com",
    phone: "(11) 11119-6789",
  },
  {
    id: "28",
    name: "Amanda Cristina Pereira",
    type: "pessoa",
    document: "357.924.680-67",
    email: "amanda.pereira@email.com",
    phone: "(11) 99996-0123",
  },
  {
    id: "29",
    name: "Vinícius Almeida Souza",
    type: "pessoa",
    document: "924.680.357-89",
    email: "vinicius.souza@email.com",
    phone: "(11) 88885-4567",
  },
  {
    id: "30",
    name: "Bianca Santos Oliveira",
    type: "pessoa",
    document: "147.369.258-01",
    email: "bianca.oliveira@email.com",
    phone: "(11) 77774-8901",
  },

  // Empresas (25 registros)
  {
    id: "31",
    name: "Construtora ABC Ltda",
    type: "empresa",
    document: "12.345.678/0001-90",
    email: "contato@construtorabc.com.br",
    phone: "(11) 3333-4444",
  },
  {
    id: "32",
    name: "Imobiliária XYZ",
    type: "empresa",
    document: "98.765.432/0001-10",
    email: "vendas@imobiliariaxyz.com.br",
    phone: "(11) 2222-3333",
  },
  {
    id: "33",
    name: "Incorporadora Moderna S.A.",
    type: "empresa",
    document: "11.222.333/0001-44",
    email: "comercial@incorporadoramoderna.com.br",
    phone: "(11) 3344-5566",
  },
  {
    id: "34",
    name: "Administradora Predial Plus",
    type: "empresa",
    document: "22.333.444/0001-55",
    email: "admin@predialplus.com.br",
    phone: "(11) 4455-6677",
  },
  {
    id: "35",
    name: "Corretora de Imóveis Prime",
    type: "empresa",
    document: "33.444.555/0001-66",
    email: "atendimento@corretoraprime.com.br",
    phone: "(11) 5566-7788",
  },
  {
    id: "36",
    name: "Construtora Horizonte Ltda",
    type: "empresa",
    document: "44.555.666/0001-77",
    email: "obras@construtorahorizonte.com.br",
    phone: "(11) 6677-8899",
  },
  {
    id: "37",
    name: "Imobiliária Central",
    type: "empresa",
    document: "55.666.777/0001-88",
    email: "central@imobiliariacentral.com.br",
    phone: "(11) 7788-9900",
  },
  {
    id: "38",
    name: "Engenharia & Construção Silva",
    type: "empresa",
    document: "66.777.888/0001-99",
    email: "projetos@engenhariasilva.com.br",
    phone: "(11) 8899-0011",
  },
  {
    id: "39",
    name: "Administradora Condomínios SP",
    type: "empresa",
    document: "77.888.999/0001-00",
    email: "condominios@adminsp.com.br",
    phone: "(11) 9900-1122",
  },
  {
    id: "40",
    name: "Corretora Imóveis Premium",
    type: "empresa",
    document: "88.999.000/0001-11",
    email: "premium@corretorapremium.com.br",
    phone: "(11) 0011-2233",
  },
  {
    id: "41",
    name: "Construtora Vanguarda S.A.",
    type: "empresa",
    document: "99.000.111/0001-22",
    email: "vanguarda@construtoravanguarda.com.br",
    phone: "(11) 1122-3344",
  },
  {
    id: "42",
    name: "Imobiliária Metropolitana",
    type: "empresa",
    document: "00.111.222/0001-33",
    email: "metro@imobiliariametro.com.br",
    phone: "(11) 2233-4455",
  },
  {
    id: "43",
    name: "Incorporadora Futuro Ltda",
    type: "empresa",
    document: "11.222.333/0001-44",
    email: "futuro@incorporadorafuturo.com.br",
    phone: "(11) 3344-5566",
  },
  {
    id: "44",
    name: "Administradora Residencial",
    type: "empresa",
    document: "22.333.444/0001-55",
    email: "residencial@adminresidencial.com.br",
    phone: "(11) 4455-6677",
  },
  {
    id: "45",
    name: "Corretora Imóveis Elite",
    type: "empresa",
    document: "33.444.555/0001-66",
    email: "elite@corretoraelite.com.br",
    phone: "(11) 5566-7788",
  },
  {
    id: "46",
    name: "Construtora Progresso",
    type: "empresa",
    document: "44.555.666/0001-77",
    email: "progresso@construtoraprogresso.com.br",
    phone: "(11) 6677-8899",
  },
  {
    id: "47",
    name: "Imobiliária Cidade Nova",
    type: "empresa",
    document: "55.666.777/0001-88",
    email: "cidadenova@imobiliariacidadenova.com.br",
    phone: "(11) 7788-9900",
  },
  {
    id: "48",
    name: "Engenharia Moderna Ltda",
    type: "empresa",
    document: "66.777.888/0001-99",
    email: "moderna@engenhariamoderna.com.br",
    phone: "(11) 8899-0011",
  },
  {
    id: "49",
    name: "Administradora Condomínios RJ",
    type: "empresa",
    document: "77.888.999/0001-00",
    email: "rj@adminrj.com.br",
    phone: "(21) 9900-1122",
  },
  {
    id: "50",
    name: "Corretora Imóveis Master",
    type: "empresa",
    document: "88.999.000/0001-11",
    email: "master@corretoramaster.com.br",
    phone: "(11) 0011-2233",
  },
  {
    id: "51",
    name: "Construtora Inovação S.A.",
    type: "empresa",
    document: "99.000.111/0001-22",
    email: "inovacao@construtoraino.com.br",
    phone: "(11) 1122-3344",
  },
  {
    id: "52",
    name: "Imobiliária Paulista",
    type: "empresa",
    document: "00.111.222/0001-33",
    email: "paulista@imobiliariapaulista.com.br",
    phone: "(11) 2233-4455",
  },
  {
    id: "53",
    name: "Incorporadora Desenvolvimento",
    type: "empresa",
    document: "11.222.333/0001-44",
    email: "desenvolvimento@incorpdesenv.com.br",
    phone: "(11) 3344-5566",
  },
  {
    id: "54",
    name: "Administradora Comercial",
    type: "empresa",
    document: "22.333.444/0001-55",
    email: "comercial@admincomercial.com.br",
    phone: "(11) 4455-6677",
  },
  {
    id: "55",
    name: "Corretora Imóveis Executiva",
    type: "empresa",
    document: "33.444.555/0001-66",
    email: "executiva@corretoraexec.com.br",
    phone: "(11) 5566-7788",
  },
]

// Mock People (extracted from mockParties for people)
export const mockPeople = mockParties
  .filter((party) => party.type === "pessoa")
  .map((party) => ({
    id: party.id,
    name: party.name,
    cpf: party.document,
    email: party.email,
    phone: party.phone,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))

// Mock Companies (extracted from mockParties for companies)
export const mockCompanies = mockParties
  .filter((party) => party.type === "empresa")
  .map((party) => ({
    id: party.id,
    name: party.name,
    cnpj: party.document,
    email: party.email,
    phone: party.phone,
    createdAt: new Date(),
    updatedAt: new Date(),
  }))

export const mockProperties: Property[] = [
  {
    id: "1",
    code: "IMV-0001",
    identification: "Apartamento Vila Madalena",
    address: {
      street: "Rua Harmonia",
      number: "123",
      complement: "Apto 45",
      neighborhood: "Vila Madalena",
      city: "São Paulo",
      state: "SP",
      zipCode: "05435-000",
    },
    type: "apartamento",
    area: 85,
    registry: "12345",
    referenceValue: 650000,
    status: "disponivel",
    createdAt: new Date("2024-01-10"),
    updatedAt: new Date("2024-01-10"),
  },
  {
    id: "2",
    code: "IMV-0002",
    identification: "Casa Jardins",
    address: {
      street: "Alameda Santos",
      number: "456",
      neighborhood: "Jardins",
      city: "São Paulo",
      state: "SP",
      zipCode: "01418-000",
    },
    type: "casa",
    area: 250,
    registry: "67890",
    referenceValue: 1200000,
    status: "comprometido",
    createdAt: new Date("2024-01-15"),
    updatedAt: new Date("2024-01-15"),
  },
  // Adicionando mais 48 imóveis para completar 50
  {
    id: "3",
    code: "IMV-0003",
    identification: "Apartamento Moema",
    address: {
      street: "Avenida Ibirapuera",
      number: "789",
      complement: "Apto 102",
      neighborhood: "Moema",
      city: "São Paulo",
      state: "SP",
      zipCode: "04029-000",
    },
    type: "apartamento",
    area: 95,
    registry: "13579",
    referenceValue: 750000,
    status: "disponivel",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "4",
    code: "IMV-0004",
    identification: "Casa Alphaville",
    address: {
      street: "Alameda Araguaia",
      number: "1000",
      neighborhood: "Alphaville",
      city: "Barueri",
      state: "SP",
      zipCode: "06454-000",
    },
    type: "casa",
    area: 300,
    registry: "24680",
    referenceValue: 1500000,
    status: "disponivel",
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25"),
  },
  {
    id: "5",
    code: "IMV-0005",
    identification: "Terreno Granja Viana",
    address: {
      street: "Estrada da Granja Viana",
      number: "2500",
      neighborhood: "Granja Viana",
      city: "Cotia",
      state: "SP",
      zipCode: "06709-015",
    },
    type: "terreno",
    area: 1000,
    registry: "35791",
    referenceValue: 800000,
    status: "disponivel",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  {
    id: "6",
    code: "IMV-0006",
    identification: "Apartamento Brooklin",
    address: {
      street: "Rua Joaquim Nabuco",
      number: "150",
      complement: "Apto 801",
      neighborhood: "Brooklin",
      city: "São Paulo",
      state: "SP",
      zipCode: "04562-000",
    },
    type: "apartamento",
    area: 120,
    registry: "46802",
    referenceValue: 900000,
    status: "comprometido",
    createdAt: new Date("2024-02-05"),
    updatedAt: new Date("2024-02-05"),
  },
  {
    id: "7",
    code: "IMV-0007",
    identification: "Casa Morumbi",
    address: {
      street: "Rua Giovanni Gronchi",
      number: "3000",
      neighborhood: "Morumbi",
      city: "São Paulo",
      state: "SP",
      zipCode: "05724-002",
    },
    type: "casa",
    area: 400,
    registry: "57913",
    referenceValue: 2200000,
    status: "disponivel",
    createdAt: new Date("2024-02-10"),
    updatedAt: new Date("2024-02-10"),
  },
  {
    id: "8",
    code: "IMV-0008",
    identification: "Apartamento Perdizes",
    address: {
      street: "Rua Cardoso de Almeida",
      number: "800",
      complement: "Apto 504",
      neighborhood: "Perdizes",
      city: "São Paulo",
      state: "SP",
      zipCode: "05013-001",
    },
    type: "apartamento",
    area: 75,
    registry: "68024",
    referenceValue: 580000,
    status: "disponivel",
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: "9",
    code: "IMV-0009",
    identification: "Casa Santana de Parnaíba",
    address: {
      street: "Rua das Palmeiras",
      number: "500",
      neighborhood: "Tamboré",
      city: "Santana de Parnaíba",
      state: "SP",
      zipCode: "06543-001",
    },
    type: "casa",
    area: 280,
    registry: "79135",
    referenceValue: 1350000,
    status: "disponivel",
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-02-20"),
  },
  {
    id: "10",
    code: "IMV-0010",
    identification: "Apartamento Itaim Bibi",
    address: {
      street: "Rua Pedroso Alvarenga",
      number: "1200",
      complement: "Apto 1205",
      neighborhood: "Itaim Bibi",
      city: "São Paulo",
      state: "SP",
      zipCode: "04531-004",
    },
    type: "apartamento",
    area: 110,
    registry: "80246",
    referenceValue: 850000,
    status: "comprometido",
    createdAt: new Date("2024-02-25"),
    updatedAt: new Date("2024-02-25"),
  },
  // Continuando com mais 40 imóveis...
  {
    id: "11",
    code: "IMV-0011",
    identification: "Terreno Osasco",
    address: {
      street: "Avenida dos Autonomistas",
      number: "5000",
      neighborhood: "Centro",
      city: "Osasco",
      state: "SP",
      zipCode: "06020-010",
    },
    type: "terreno",
    area: 500,
    registry: "91357",
    referenceValue: 400000,
    status: "disponivel",
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
  {
    id: "12",
    code: "IMV-0012",
    identification: "Casa Vila Olímpia",
    address: {
      street: "Rua Funchal",
      number: "800",
      neighborhood: "Vila Olímpia",
      city: "São Paulo",
      state: "SP",
      zipCode: "04551-060",
    },
    type: "casa",
    area: 200,
    registry: "02468",
    referenceValue: 1800000,
    status: "disponivel",
    createdAt: new Date("2024-03-05"),
    updatedAt: new Date("2024-03-05"),
  },
  {
    id: "13",
    code: "IMV-0013",
    identification: "Apartamento Pinheiros",
    address: {
      street: "Rua dos Pinheiros",
      number: "1500",
      complement: "Apto 302",
      neighborhood: "Pinheiros",
      city: "São Paulo",
      state: "SP",
      zipCode: "05422-001",
    },
    type: "apartamento",
    area: 90,
    registry: "13579",
    referenceValue: 720000,
    status: "disponivel",
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-03-10"),
  },
  {
    id: "14",
    code: "IMV-0014",
    identification: "Casa Higienópolis",
    address: {
      street: "Rua Maranhão",
      number: "200",
      neighborhood: "Higienópolis",
      city: "São Paulo",
      state: "SP",
      zipCode: "01240-000",
    },
    type: "casa",
    area: 350,
    registry: "24680",
    referenceValue: 2500000,
    status: "comprometido",
    createdAt: new Date("2024-03-15"),
    updatedAt: new Date("2024-03-15"),
  },
  {
    id: "15",
    code: "IMV-0015",
    identification: "Apartamento Campo Belo",
    address: {
      street: "Rua Vieira de Morais",
      number: "600",
      complement: "Apto 701",
      neighborhood: "Campo Belo",
      city: "São Paulo",
      state: "SP",
      zipCode: "04617-000",
    },
    type: "apartamento",
    area: 105,
    registry: "35791",
    referenceValue: 780000,
    status: "disponivel",
    createdAt: new Date("2024-03-20"),
    updatedAt: new Date("2024-03-20"),
  },
  // Adicionando mais 35 imóveis para completar 50 total
  ...Array.from({ length: 35 }, (_, i) => {
    const id = (16 + i).toString()
    const neighborhoods = [
      "Vila Mariana",
      "Saúde",
      "Cursino",
      "Ipiranga",
      "Aclimação",
      "Liberdade",
      "Bela Vista",
      "Consolação",
      "Santa Cecília",
      "Campos Elíseos",
      "Bom Retiro",
      "Luz",
      "República",
      "Sé",
      "Cambuci",
      "Mooca",
      "Brás",
      "Pari",
      "Belém",
      "Tatuapé",
      "Vila Formosa",
      "Penha",
      "Vila Matilde",
      "Cidade Tiradentes",
      "Guaianases",
      "Itaquera",
      "São Mateus",
      "Sapopemba",
      "Vila Prudente",
      "São Lucas",
      "Jabaquara",
      "Cidade Ademar",
      "Pedreira",
      "Cidade Dutra",
      "Grajaú",
    ]
    const types = ["apartamento", "casa", "terreno"] as const
    const streets = [
      "Rua das Flores",
      "Avenida Paulista",
      "Rua Augusta",
      "Alameda Lorena",
      "Rua Oscar Freire",
      "Avenida Faria Lima",
      "Rua Teodoro Sampaio",
      "Avenida Rebouças",
      "Rua da Consolação",
      "Avenida São João",
    ]

    const type = types[i % types.length]
    const neighborhood = neighborhoods[i % neighborhoods.length]
    const street = streets[i % streets.length]

    return {
      id,
      code: `IMV-${(16 + i).toString().padStart(4, "0")}`,
      identification: `${type === "apartamento" ? "Apartamento" : type === "casa" ? "Casa" : "Terreno"} ${neighborhood}`,
      address: {
        street,
        number: (100 + i * 10).toString(),
        complement: type === "apartamento" ? `Apto ${100 + i}` : undefined,
        neighborhood,
        city: "São Paulo",
        state: "SP",
        zipCode: `${(1000 + i).toString().padStart(5, "0")}-000`,
      },
      type,
      area: type === "terreno" ? 300 + i * 20 : type === "casa" ? 150 + i * 10 : 60 + i * 5,
      registry: (10000 + i * 100).toString(),
      referenceValue:
        type === "terreno" ? 300000 + i * 50000 : type === "casa" ? 800000 + i * 100000 : 400000 + i * 50000,
      status: i % 3 === 0 ? "comprometido" : "disponivel",
      createdAt: new Date(2024, 0, 1 + i),
      updatedAt: new Date(2024, 0, 1 + i),
    } as Property
  }),
]

export const mockVehicles: Vehicle[] = [
  {
    id: "1",
    code: "VEI-0001",
    type: "carro",
    brand: "Toyota",
    model: "Corolla",
    year: 2022,
    plate: "ABC-1234",
    chassis: "9BR53ZEC4D8123456",
    referenceValue: 95000,
    status: "disponivel",
    createdAt: new Date("2024-01-20"),
    updatedAt: new Date("2024-01-20"),
  },
  {
    id: "2",
    code: "VEI-0002",
    type: "moto",
    brand: "Honda",
    model: "CB 600F",
    year: 2021,
    plate: "XYZ-5678",
    chassis: "9C2JC3210LR123456",
    referenceValue: 35000,
    status: "disponivel",
    createdAt: new Date("2024-01-25"),
    updatedAt: new Date("2024-01-25"),
  },
  // Adicionando mais 48 veículos para completar 50
  ...Array.from({ length: 48 }, (_, i) => {
    const id = (3 + i).toString()
    const types = ["carro", "moto", "caminhao", "barco"] as const
    const brands = {
      carro: ["Toyota", "Honda", "Volkswagen", "Ford", "Chevrolet", "Hyundai", "Nissan", "Fiat", "BMW", "Mercedes"],
      moto: ["Honda", "Yamaha", "Suzuki", "Kawasaki", "BMW", "Ducati", "Harley-Davidson", "Triumph", "KTM", "Aprilia"],
      caminhao: ["Mercedes", "Volvo", "Scania", "Iveco", "Ford", "Volkswagen", "DAF", "MAN", "Renault", "Isuzu"],
      barco: ["Lancha", "Veleiro", "Iate", "Jet Ski", "Catamarã", "Trawler", "Speedboat", "Fishing", "Cabin", "Sport"],
    }
    const models = {
      carro: ["Civic", "Accord", "Camry", "Fusion", "Cruze", "Elantra", "Sentra", "Uno", "X3", "C-Class"],
      moto: ["CBR", "YZF", "GSX", "Ninja", "R1200", "Panigale", "Street", "Speed", "Duke", "RSV4"],
      caminhao: ["Actros", "FH", "R-Series", "Daily", "Cargo", "Constellation", "XF", "TGX", "Master", "NPR"],
      barco: [
        "Sport 30",
        "Ocean 40",
        "Luxury 50",
        "Wave 25",
        "Multi 35",
        "Fisher 28",
        "Speed 32",
        "Cabin 38",
        "Sport 42",
        "Fishing 26",
      ],
    }

    const type = types[i % types.length]
    const brandOptions = brands[type]
    const modelOptions = models[type]
    const brand = brandOptions[i % brandOptions.length]
    const model = modelOptions[i % modelOptions.length]

    return {
      id,
      code: `VEI-${(3 + i).toString().padStart(4, "0")}`,
      type,
      brand,
      model,
      year: 2018 + (i % 6),
      plate: `${String.fromCharCode(65 + (i % 26))}${String.fromCharCode(65 + ((i + 1) % 26))}${String.fromCharCode(65 + ((i + 2) % 26))}-${(1000 + i).toString().slice(-4)}`,
      chassis: `9BR${(10000000000000 + i * 1000).toString().slice(-13)}`,
      referenceValue:
        type === "barco"
          ? 200000 + i * 50000
          : type === "caminhao"
            ? 150000 + i * 30000
            : type === "carro"
              ? 50000 + i * 10000
              : 20000 + i * 5000,
      status: i % 4 === 0 ? "comprometido" : "disponivel",
      createdAt: new Date(2024, 0, 1 + i),
      updatedAt: new Date(2024, 0, 1 + i),
    } as Vehicle
  }),
]

export const mockCredits: Credit[] = [
  {
    id: "1",
    code: "CRD-0001",
    creditor: "Carlos Eduardo Mendes",
    debtor: "Ana Paula Costa",
    origin: "Empréstimo pessoal",
    nominalValue: 50000,
    saldoGRA: 45000,
    interestRate: "1,5% a.m.",
    startDate: new Date("2024-01-01"),
    dueDate: new Date("2024-12-31"),
    status: "disponivel",
    createdAt: new Date("2024-01-01"),
    updatedAt: new Date("2024-01-01"),
  },
  // Adicionando mais 49 créditos para completar 50
  ...Array.from({ length: 49 }, (_, i) => {
    const id = (2 + i).toString()
    const creditors = mockParties.filter((p) => p.type === "pessoa").slice(0, 15)
    const debtors = mockParties.filter((p) => p.type === "pessoa").slice(15, 30)
    const origins = [
      "Empréstimo pessoal",
      "Financiamento imobiliário",
      "Crédito empresarial",
      "Antecipação de recebíveis",
      "Capital de giro",
      "Investimento em projeto",
      "Empréstimo com garantia",
      "Crédito consignado",
      "Financiamento de veículo",
      "Empréstimo para reforma",
    ]
    const rates = ["1,2% a.m.", "1,5% a.m.", "1,8% a.m.", "2,0% a.m.", "2,5% a.m.", "3,0% a.m."]

    const creditor = creditors[i % creditors.length]
    const debtor = debtors[i % debtors.length]
    const origin = origins[i % origins.length]
    const rate = rates[i % rates.length]
    const nominalValue = 25000 + i * 5000
    const saldoGRA = Math.round(nominalValue * (0.7 + (i % 30) / 100))

    return {
      id,
      code: `CRD-${(2 + i).toString().padStart(4, "0")}`,
      creditor: creditor.name,
      debtor: debtor.name,
      origin,
      nominalValue,
      saldoGRA,
      interestRate: rate,
      startDate: new Date(2024, i % 12, 1),
      dueDate: new Date(2024 + Math.floor(i / 12), (i + 6) % 12, 28),
      status: i % 5 === 0 ? "comprometido" : "disponivel",
      createdAt: new Date(2024, i % 12, 1),
      updatedAt: new Date(2024, i % 12, 1),
    } as Credit
  }),
]

export const mockDevelopments: Development[] = [
  {
    id: "1",
    code: "EMP-0001",
    name: "Residencial Sunset",
    type: "predio",
    location: "Alphaville, Barueri - SP",
    participationPercentage: 25,
    units: ["Torre A - Apto 101", "Torre A - Apto 102", "Torre B - Apto 201"],
    referenceValue: 2500000,
    status: "disponivel",
    createdAt: new Date("2024-02-01"),
    updatedAt: new Date("2024-02-01"),
  },
  // Adicionando mais 49 empreendimentos para completar 50
  ...Array.from({ length: 49 }, (_, i) => {
    const id = (2 + i).toString()
    const types = ["predio", "condominio", "loteamento", "shopping", "comercial"] as const
    const locations = [
      "Vila Madalena, São Paulo - SP",
      "Jardins, São Paulo - SP",
      "Moema, São Paulo - SP",
      "Brooklin, São Paulo - SP",
      "Itaim Bibi, São Paulo - SP",
      "Vila Olímpia, São Paulo - SP",
      "Pinheiros, São Paulo - SP",
      "Perdizes, São Paulo - SP",
      "Higienópolis, São Paulo - SP",
      "Campo Belo, São Paulo - SP",
      "Morumbi, São Paulo - SP",
      "Granja Viana, Cotia - SP",
      "Alphaville, Barueri - SP",
      "Tamboré, Santana de Parnaíba - SP",
      "Centro, Osasco - SP",
    ]
    const names = [
      "Residencial",
      "Condomínio",
      "Edifício",
      "Torre",
      "Plaza",
      "Center",
      "Park",
      "Garden",
      "Square",
      "Boulevard",
      "Avenue",
      "Terrace",
      "Vista",
      "Horizon",
      "Sunset",
    ]
    const adjectives = [
      "Premium",
      "Exclusive",
      "Luxury",
      "Modern",
      "Classic",
      "Elite",
      "Prime",
      "Royal",
      "Golden",
      "Diamond",
      "Platinum",
      "Crystal",
      "Emerald",
      "Sapphire",
      "Ruby",
    ]

    const type = types[i % types.length]
    const location = locations[i % locations.length]
    const name = `${names[i % names.length]} ${adjectives[i % adjectives.length]}`

    const unitCount = 5 + (i % 20)
    const units = Array.from({ length: unitCount }, (_, j) =>
      type === "predio"
        ? `Torre ${String.fromCharCode(65 + (j % 3))} - Apto ${101 + j}`
        : type === "condominio"
          ? `Casa ${j + 1}`
          : type === "loteamento"
            ? `Lote ${j + 1}`
            : type === "shopping"
              ? `Loja ${j + 1}`
              : `Sala ${j + 1}`,
    )

    return {
      id,
      code: `EMP-${(2 + i).toString().padStart(4, "0")}`,
      name,
      type,
      location,
      participationPercentage: 10 + (i % 40),
      units,
      referenceValue: 1000000 + i * 200000,
      status: i % 6 === 0 ? "comprometido" : "disponivel",
      createdAt: new Date(2024, i % 12, 1),
      updatedAt: new Date(2024, i % 12, 1),
    } as Development
  }),
]

export const mockCashTransactions: CashTransaction[] = [
  {
    id: "1",
    date: new Date("2024-03-01"),
    type: "entrada",
    description: "Recebimento parcela contrato CT-0001",
    vinculo: "Contratos",
    forma: "Caixa",
    centroCusto: "Vendas",
    value: 25000,
    createdAt: new Date("2024-03-01"),
  },
  {
    id: "2",
    date: new Date("2024-03-02"),
    type: "saida",
    description: "Pagamento comissão",
    vinculo: "Comissões",
    forma: "Caixa",
    centroCusto: "Administrativo",
    value: 5000,
    createdAt: new Date("2024-03-02"),
  },
  ...Array.from({ length: 48 }, (_, i) => {
    const id = (3 + i).toString()
    const types = ["entrada", "saida"] as const
    const entryDescriptions = [
      "Recebimento parcela contrato",
      "Venda de imóvel",
      "Aluguel recebido",
      "Comissão de venda",
      "Rendimento de aplicação",
      "Recebimento de crédito",
      "Venda de veículo",
      "Participação em empreendimento",
      "Consultoria prestada",
      "Serviços imobiliários",
    ]
    const exitDescriptions = [
      "Pagamento de comissão",
      "Despesas administrativas",
      "Manutenção predial",
      "Taxa de administração",
      "Pagamento fornecedor",
      "Impostos e taxas",
      "Marketing e publicidade",
      "Despesas operacionais",
      "Investimento em projeto",
      "Pagamento de empréstimo",
    ]
    const vinculos = [
      "Contratos",
      "Vendas",
      "Aluguéis",
      "Comissões",
      "Despesas",
      "Investimentos",
      "Impostos",
      "Marketing",
      "Operacional",
      "Financeiro",
    ]
    const formas = ["Caixa", "Permuta"] as const
    const centrosCusto = ["Vendas", "Veículos", "Imóveis", "Fornecedores", "Obras", "Predial", "Administrativo"]

    const type = types[i % 2]
    const descriptions = type === "entrada" ? entryDescriptions : exitDescriptions
    const description = descriptions[i % descriptions.length]
    const vinculo = vinculos[i % vinculos.length]
    const forma = formas[i % formas.length]
    const centroCusto = centrosCusto[i % centrosCusto.length]
    const value = 1000 + i * 500

    return {
      id,
      date: new Date(2024, 2, 3 + i),
      type,
      description: `${description} ${i + 1}`,
      vinculo,
      forma,
      centroCusto,
      value,
      createdAt: new Date(2024, 2, 3 + i),
    } as CashTransaction
  }),
]

const mockVinculos = [
  "Contratos",
  "Vendas",
  "Aluguéis",
  "Comissões",
  "Despesas",
  "Investimentos",
  "Impostos",
  "Marketing",
  "Operacional",
  "Financeiro",
]

const mockCentrosCusto = ["Vendas", "Veículos", "Imóveis", "Fornecedores", "Obras", "Predial", "Administrativo"]

export const mockAccountsReceivable: AccountReceivable[] = [
  {
    id: "1",
    code: "CR-0923.2",
    contractId: "CT-0001",
    description: "Parcela 2/12 - Contrato Apartamento Vila Madalena",
    counterparty: "Carlos Eduardo Mendes",
    value: 25000,
    dueDate: new Date("2024-04-01"),
    status: "em_aberto",
    installment: { current: 2, total: 12 },
    vinculo: "Contratos",
    centroCusto: "Vendas",
    dataRegistro: new Date("2024-03-01"),
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
  {
    id: "2",
    code: "CR-0845.1",
    contractId: "CT-0002",
    description: "Parcela única - Venda veículo",
    counterparty: "Ana Paula Costa",
    value: 95000,
    dueDate: new Date("2024-03-25"),
    status: "vencido",
    vinculo: "Vendas",
    centroCusto: "Veículos",
    dataRegistro: new Date("2024-02-25"),
    createdAt: new Date("2024-02-25"),
    updatedAt: new Date("2024-02-25"),
  },
  {
    id: "3",
    code: "CR-1205.1",
    description: "Aluguel mensal - Imóvel comercial",
    counterparty: "Empresa ABC Ltda",
    value: 8500,
    dueDate: new Date("2024-04-05"),
    status: "em_aberto",
    vinculo: "Aluguéis",
    centroCusto: "Imóveis",
    dataRegistro: new Date("2024-03-05"),
    createdAt: new Date("2024-03-05"),
    updatedAt: new Date("2024-03-05"),
  },
  // Adicionando mais 47 contas a receber para completar 50
  ...Array.from({ length: 47 }, (_, i) => {
    const id = (4 + i).toString()
    const statuses = ["em_aberto", "vencido", "pago"] as const
    const vinculos = mockVinculos
    const centrosCusto = mockCentrosCusto
    const counterparties = mockParties.slice(0, 20)

    const descriptions = [
      "Parcela contrato imobiliário",
      "Aluguel mensal",
      "Comissão de venda",
      "Prestação de serviços",
      "Venda de veículo",
      "Participação em empreendimento",
      "Consultoria imobiliária",
      "Taxa de administração",
      "Rendimento de aplicação",
      "Recebimento de crédito",
    ]

    const status = statuses[i % statuses.length]
    const vinculo = vinculos[i % vinculos.length]
    const centroCusto = centrosCusto[i % centrosCusto.length]
    const counterparty = counterparties[i % counterparties.length]
    const description = descriptions[i % descriptions.length]
    const value = 5000 + i * 1000
    const dueDate = new Date(2024, 3 + (i % 9), 1 + (i % 28))

    const hasInstallments = i % 4 === 0
    const installment = hasInstallments
      ? {
          current: (i % 12) + 1,
          total: 12,
        }
      : undefined

    return {
      id,
      code: `CR-${(1000 + i).toString()}.${hasInstallments ? (i % 12) + 1 : 1}`,
      contractId: i % 3 === 0 ? `CT-${(i + 1).toString().padStart(4, "0")}` : undefined,
      description: `${description} ${i + 1}`,
      counterparty: counterparty.name,
      value,
      dueDate,
      status,
      installment,
      vinculo,
      centroCusto,
      dataRegistro: new Date(2024, 2 + (i % 10), 1),
      createdAt: new Date(2024, 2 + (i % 10), 1),
      updatedAt: new Date(2024, 2 + (i % 10), 1),
    } as AccountReceivable
  }),
]

export const mockAccountsPayable: AccountPayable[] = [
  {
    id: "1",
    code: "CP-0541.1",
    description: "Comissão corretagem",
    counterparty: "Imobiliária XYZ",
    value: 15000,
    dueDate: new Date("2024-03-30"),
    status: "em_aberto",
    vinculo: "Comissões",
    centroCusto: "Vendas",
    dataRegistro: new Date("2024-03-01"),
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
  },
  {
    id: "2",
    code: "CP-0782.2",
    description: "Pagamento fornecedor",
    counterparty: "Construtora ABC Ltda",
    value: 8500,
    dueDate: new Date(),
    status: "em_aberto",
    vinculo: "Fornecedores",
    centroCusto: "Obras",
    dataRegistro: new Date("2024-02-15"),
    createdAt: new Date("2024-02-15"),
    updatedAt: new Date("2024-02-15"),
  },
  {
    id: "3",
    code: "CP-0329.1",
    description: "Taxa de administração",
    counterparty: "Administradora Predial",
    value: 2300,
    dueDate: new Date(),
    status: "em_aberto",
    vinculo: "Taxas",
    centroCusto: "Administrativo",
    dataRegistro: new Date("2024-02-20"),
    createdAt: new Date("2024-02-20"),
    updatedAt: new Date("2024-02-20"),
  },
  {
    id: "4",
    code: "CP-0156.3",
    description: "Manutenção predial",
    counterparty: "Empresa de Manutenção",
    value: 4200,
    dueDate: new Date("2024-04-10"),
    status: "em_aberto",
    vinculo: "Manutenção",
    centroCusto: "Predial",
    dataRegistro: new Date("2024-03-10"),
    createdAt: new Date("2024-03-10"),
    updatedAt: new Date("2024-03-10"),
  },
  // Adicionando mais 46 contas a pagar para completar 50
  ...Array.from({ length: 46 }, (_, i) => {
    const id = (5 + i).toString()
    const statuses = ["em_aberto", "vencido", "pago"] as const
    const vinculos = mockVinculos
    const centrosCusto = mockCentrosCusto
    const counterparties = mockParties.filter((p) => p.type === "empresa")

    const descriptions = [
      "Comissão de venda",
      "Pagamento fornecedor",
      "Taxa de administração",
      "Manutenção predial",
      "Despesas operacionais",
      "Marketing e publicidade",
      "Impostos e taxas",
      "Consultoria jurídica",
      "Serviços contábeis",
      "Despesas administrativas",
    ]

    const status = statuses[i % statuses.length]
    const vinculo = vinculos[i % vinculos.length]
    const centroCusto = centrosCusto[i % centrosCusto.length]
    const counterparty = counterparties[i % counterparties.length]
    const description = descriptions[i % descriptions.length]
    const value = 2000 + i * 800
    const dueDate = new Date(2024, 3 + (i % 9), 1 + (i % 28))

    return {
      id,
      code: `CP-${(2000 + i).toString()}.1`,
      description: `${description} ${i + 1}`,
      counterparty: counterparty.name,
      value,
      dueDate,
      status,
      vinculo,
      centroCusto,
      dataRegistro: new Date(2024, 2 + (i % 10), 1),
      createdAt: new Date(2024, 2 + (i % 10), 1),
      updatedAt: new Date(2024, 2 + (i % 10), 1),
    } as AccountPayable
  }),
]

export const mockContracts: Contract[] = [
  {
    id: "1",
    code: "CT-0001",
    date: new Date("2024-03-01"),
    sideA: {
      name: "Lado A",
      parties: [mockParties[0]], // Carlos Eduardo Mendes
      items: [
        {
          id: "1",
          type: "dinheiro",
          description: "Pagamento à vista",
          value: 300000,
          participants: [{ partyId: "1", percentage: 100 }],
        },
      ],
      totalValue: 300000,
    },
    sideB: {
      name: "Lado B",
      parties: [mockParties[1]], // Ana Paula Costa
      items: [
        {
          id: "2",
          type: "imovel",
          itemId: "1",
          description: "Apartamento Vila Madalena",
          value: 300000,
          participants: [{ partyId: "2", percentage: 100 }],
        },
      ],
      totalValue: 300000,
    },
    balance: 0,
    paymentConditions: {
      installments: 12,
      firstDueDate: new Date("2024-03-01"),
      frequency: "mensal",
      paymentMethod: "Transferência bancária",
    },
    createdBy: "1",
    createdAt: new Date("2024-03-01"),
    updatedAt: new Date("2024-03-01"),
    history: [
      {
        id: "1",
        action: "criacao",
        description: "Contrato criado",
        author: "João Silva",
        date: new Date("2024-03-01"),
      },
    ],
  },
  // Adicionando mais 49 contratos para completar 50
  ...Array.from({ length: 49 }, (_, i) => {
    const id = (2 + i).toString()
    const partyA = mockParties[i % 25]
    const partyB = mockParties[(i + 25) % 50]
    const property = mockProperties[i % mockProperties.length]
    const vehicle = mockVehicles[i % mockVehicles.length]

    const contractTypes = ["compra_venda_imovel", "compra_venda_veiculo", "emprestimo", "parceria"]
    const contractType = contractTypes[i % contractTypes.length]

    let sideAItems, sideBItems, totalValue

    switch (contractType) {
      case "compra_venda_imovel":
        totalValue = property.referenceValue
        sideAItems = [
          {
            id: `${i + 2}_1`,
            type: "dinheiro" as const,
            description: "Pagamento pela compra do imóvel",
            value: totalValue,
            participants: [{ partyId: partyA.id, percentage: 100 }],
          },
        ]
        sideBItems = [
          {
            id: `${i + 2}_2`,
            type: "imovel" as const,
            itemId: property.id,
            description: property.identification,
            value: totalValue,
            participants: [{ partyId: partyB.id, percentage: 100 }],
          },
        ]
        break

      case "compra_venda_veiculo":
        totalValue = vehicle.referenceValue
        sideAItems = [
          {
            id: `${i + 2}_1`,
            type: "dinheiro" as const,
            description: "Pagamento pela compra do veículo",
            value: totalValue,
            participants: [{ partyId: partyA.id, percentage: 100 }],
          },
        ]
        sideBItems = [
          {
            id: `${i + 2}_2`,
            type: "veiculo" as const,
            itemId: vehicle.id,
            description: `${vehicle.brand} ${vehicle.model}`,
            value: totalValue,
            participants: [{ partyId: partyB.id, percentage: 100 }],
          },
        ]
        break

      case "emprestimo":
        totalValue = 50000 + i * 10000
        sideAItems = [
          {
            id: `${i + 2}_1`,
            type: "dinheiro" as const,
            description: "Empréstimo concedido",
            value: totalValue,
            participants: [{ partyId: partyA.id, percentage: 100 }],
          },
        ]
        sideBItems = [
          {
            id: `${i + 2}_2`,
            type: "dinheiro" as const,
            description: "Pagamento do empréstimo com juros",
            value: totalValue * 1.2,
            participants: [{ partyId: partyB.id, percentage: 100 }],
          },
        ]
        break

      default: // parceria
        totalValue = 100000 + i * 20000
        sideAItems = [
          {
            id: `${i + 2}_1`,
            type: "dinheiro" as const,
            description: "Investimento na parceria",
            value: totalValue,
            participants: [{ partyId: partyA.id, percentage: 100 }],
          },
        ]
        sideBItems = [
          {
            id: `${i + 2}_2`,
            type: "servico" as const,
            description: "Prestação de serviços especializados",
            value: totalValue,
            participants: [{ partyId: partyB.id, percentage: 100 }],
          },
        ]
    }

    return {
      id,
      code: `CT-${(2 + i).toString().padStart(4, "0")}`,
      date: new Date(2024, i % 12, 1 + (i % 28)),
      sideA: {
        name: "Lado A",
        parties: [partyA],
        items: sideAItems,
        totalValue,
      },
      sideB: {
        name: "Lado B",
        parties: [partyB],
        items: sideBItems,
        totalValue: sideBItems[0].value,
      },
      balance: i % 3 === 0 ? 0 : totalValue * 0.1,
      paymentConditions: {
        installments: i % 2 === 0 ? 1 : 6 + (i % 18),
        firstDueDate: new Date(2024, i % 12, 15),
        frequency: i % 2 === 0 ? ("unica" as const) : ("mensal" as const),
        paymentMethod: i % 2 === 0 ? "À vista" : "Transferência bancária",
      },
      createdBy: "1",
      createdAt: new Date(2024, i % 12, 1),
      updatedAt: new Date(2024, i % 12, 1),
      history: [
        {
          id: `${i + 2}_hist_1`,
          action: "criacao" as const,
          description: "Contrato criado",
          author: "João Silva",
          date: new Date(2024, i % 12, 1),
        },
      ],
    } as Contract
  }),
]

export const mockBankAccounts: BankAccount[] = [
  {
    id: "1",
    name: "Banco do Brasil",
    type: "banco",
    balance: 150000,
    code: "001",
  },
  {
    id: "2",
    name: "Sicoob Geraldo",
    type: "banco",
    balance: 85000,
    code: "756",
  },
  {
    id: "3",
    name: "Sicoob GRA",
    type: "banco",
    balance: 120000,
    code: "756",
  },
  {
    id: "4",
    name: "Sicoob Carvalho",
    type: "banco",
    balance: 95000,
    code: "756",
  },
  {
    id: "5",
    name: "Caixa",
    type: "especie",
    balance: 12000,
  },
]

export const mockCashTransactionsExtended = mockCashTransactions.map((transaction, index) => ({
  ...transaction,
  accountId: mockBankAccounts[index % mockBankAccounts.length].id,
  accountName: mockBankAccounts[index % mockBankAccounts.length].name,
}))

export { mockVinculos, mockCentrosCusto }
