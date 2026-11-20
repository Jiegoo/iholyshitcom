export default function ContentDisclosure({locale}:{locale:'zh'|'en'}) {
  return <aside className="content-disclosure"><p>{locale==='zh'?'内容由本部署的编辑团队负责，请核对来源并及时更正错误。':'Content is the responsibility of this deployment’s editorial team. Check sources and correct errors.'}</p></aside>;
}
