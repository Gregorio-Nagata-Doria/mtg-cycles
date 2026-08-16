import Image from "next/image";

// O leque de 5 miniaturas encostadas. Mora aqui, e não dentro do
// <CyclePreview>, porque a lista de resultados desenha o mesmo leque a partir
// do índice do cliente, que não tem carta — só a URL reconstruída do id. Duas
// cópias do mesmo empilhamento divergiriam no primeiro ajuste de rotação.
//
// ⚠️ Não pode importar `@cycles`: é usado por componente cliente e o JSON tem
// 3,1 MB. Por isso recebe URL pronta, não a carta.
const FAN = [
  "z-0 -rotate-16 translate-y-5 group-hover:-rotate-20 group-hover:translate-y-5.5",
  "z-10 -rotate-8 translate-y-1.5 group-hover:-rotate-10",
  "z-20 rotate-0 group-hover:rotate-0",
  "z-30 rotate-8 translate-y-1.5 group-hover:rotate-10",
  "z-40 rotate-16 translate-y-5 group-hover:rotate-20 group-hover:translate-y-5.5",
];

export function CardFan({ images }: { images: { src: string; alt: string }[] }) {
  return (
    <div className="group flex h-32.5 items-end justify-center overflow-hidden [&>*+*]:-ml-13">
      {images.map((image, i) => (
        <Image
          src={image.src}
          alt={image.alt}
          key={image.src}
          width={82}
          height={114}
          unoptimized
          className={`w-20.5 rounded-[5px] shadow-card transition-transform duration-200 ease-out ${FAN[i]}`}
        />
      ))}
    </div>
  );
}
