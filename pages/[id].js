import { Fragment } from "react";
import Head from "next/head";
import { getDatabase, getPage, getBlocks } from "../lib/notion";
import Link from "next/link";
import { databaseId } from "./index.js";
import styles from "./post.module.css";

let toc = []
export const Text = ({ text }) => {
  if (!text) {
    return null;
  }
  return text.map((value) => {
    const {
      annotations: { bold, code, color, italic, strikethrough, underline },
      text,
    } = value;
    return (
      <span
        className={[
          bold ? styles.bold : "",
          color ? "notion-" + color : "",
          code ? styles.code : "",
          italic ? styles.italic : "",
          strikethrough ? styles.strikethrough : "",
          underline ? styles.underline : "",
        ].join(" ")}
        key={text.content}
      >
        {text.link ? <a href={text.link.url}>{text.content}</a> : text.content}
      </span>
    );
  });
};

const renderNestedList = (block) => {
  // console.log("========renderNestedList");
  const { type } = block;
  const value = block[type];
  // console.log(value);
  if (!value) return null;

  const isNumberedList = block.children[0].type === "numbered_list_item";

  if (isNumberedList) {
    return <ol class="notion-list notion-list-disc a">{block.children.map((block) => renderBlock(block))}</ol>;
  }
  // console.log(22222);
  return <ul classs="notion-list notion-list-disc b">{block.children.map((block) => renderBlock(block))}</ul>;
};

function setType(block) {
  const { type, id } = block;
  const value = block[type];
  switch (type) {
    case "paragraph":
      return (
        <p>
          <Text text={value.rich_text} />
        </p>
      );
    case "heading_1":
      return (
        <h1 className=" notion-h1">
          <Text text={value.rich_text} />
        </h1>
      );
    case "heading_2":
      return (
        <h2 className="text-4xl">
          <Text text={value.rich_text} />
        </h2>
      );
    case "heading_3":
      return (
        <h3 className="notion-h notion-h3">
          <Text text={value.rich_text} />
        </h3>
      );
    case "bulleted_list": {
      // console.log("========bulleted_list");
      // console.log(value);
      return <ul className="notion-list notion-list-disc c">{value.children.map((child) => renderBlock(child))}</ul>;
    }
    case "numbered_list": {
      return <ol className="notion-list notion-list-disc">{value.children.map((child) => renderBlock(child))}</ol>;
    }
    case "bulleted_list_item":
      // console.log("========bulleted_list_item");
      // console.log(value);
      return (
        <li key={block.id}>
          <Text text={value.rich_text} />
          {!!block.children && renderNestedList(block)}
        </li>
      );
    case "numbered_list_item":

      return (
        <li key={block.id}>
          <Text text={value.rich_text} />
          {!!block.children && renderNestedList(block)}
        </li>
      );
    case "to_do":
      return (
        <div>
          <label htmlFor={id}>
            <input type="checkbox" id={id} defaultChecked={value.checked} />{" "}
            <Text text={value.rich_text} />
          </label>
        </div>
      );
    case "toggle":
      return (
        <details>
          <summary>
            <Text text={value.rich_text} />
          </summary>
          {block.children?.map((child) => (
            <Fragment key={child.id}>{renderBlock(child)}</Fragment>
          ))}
        </details>
      );
    case "child_page":
      return (
        <div className={styles.childPage}>
          <strong>{value.title}</strong>
          {block.children.map((child) => renderBlock(child))}
        </div>
      );
    case "image":
      const src =
        value.type === "external" ? value.external.url : value.file.url;
      const caption = value.caption ? value.caption[0]?.plain_text : "";
      return (
        <figure className="notion-asset-wrapper notion-asset-wrapper-image">
          <div className="wrap">
            <img src={src} alt={caption} />
          </div>
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      );
    case "divider":
      return <hr key={id} />;
    case "quote":
      return <blockquote className="notion-quote" key={id}>{value.rich_text[0].plain_text}</blockquote>;
    case "code":
      return (
        <pre className={styles.pre}>
          <code className={styles.code_block} key={id}>
            {value.rich_text[0].plain_text}
          </code>
        </pre>
      );
    case "file":
      const src_file =
        value.type === "external" ? value.external.url : value.file.url;
      const splitSourceArray = src_file.split("/");
      const lastElementInArray = splitSourceArray[splitSourceArray.length - 1];
      const caption_file = value.caption ? value.caption[0]?.plain_text : "";
      return (
        <figure className="notion-file ">

          <Link className="notion-file-link" href={src_file} passHref>
            <span><svg className="notion-file-icon" viewBox="0 0 30 30"><path d="M22,8v12c0,3.866-3.134,7-7,7s-7-3.134-7-7V8c0-2.762,2.238-5,5-5s5,2.238,5,5v12c0,1.657-1.343,3-3,3s-3-1.343-3-3V8h-2v12c0,2.762,2.238,5,5,5s5-2.238,5-5V8c0-3.866-3.134-7-7-7S6,4.134,6,8v12c0,4.971,4.029,9,9,9s9-4.029,9-9V8H22z"></path></svg></span> {lastElementInArray.split("?")[0]}
          </Link>
          {caption_file && <figcaption>{caption_file}</figcaption>}
        </figure>
      );
    case "bookmark":
      const href = value.url;
      return (
        <a href={href} target="_brank" className={styles.bookmark}>
          {href}
        </a>
      );
    case "table": {
      if (block['table'].table_width == 2) {
        return (
          <table data="2" className="charts-css column show-labels">

            <tbody>
              {block.children?.map((child, i) => {

                return (
                  <tr key={child.id}>
                    {child.table_row?.cells?.map((cell, i) => {
                      const RowElement =
                        /* value.has_column_header && */ i == 0 ? "th" : "td";
                      return (
                        // <th scope="row">2016</th>
                        <RowElement style={{ "--size": ` ${(cell[0].plain_text)}` }} key={`${cell.plain_text}-${i}`} data={i}>
                          {i == 0 ? <Text text={cell} /> : cell[0].plain_text * 10000 / 100}{i == 1 ? "%" : ""}
                        </RowElement>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      } else {
        return (
          <table className={styles.table}>
            <tbody>
              {block.children?.map((child, i) => {
                const RowElement =
                  value.has_column_header && i == 0 ? "th" : "td";
                return (
                  <tr key={child.id}>
                    {child.table_row?.cells?.map((cell, i) => {
                      return (
                        <RowElement key={`${cell.plain_text}-${i}`}>
                          <Text text={cell} />
                        </RowElement>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      }

    }
    case "column_list": {
      return (
        <div className={styles.row}>
          {block.children.map((block) => renderBlock(block))}
        </div>
      );
    }
    case "column": {
      return <div>{block.children.map((child) => renderBlock(child))}</div>;
    }
    case "callout": {
      return (
        <div className="notion-callout notion-gray_background_co">
          <div className="notion-page-icon-inline notion-page-icon-span"><span className="notion-page-icon" role="img"
            aria-label="💡">💡</span></div>
          <div className="notion-callout-text">{(value.rich_text[0].text.content)}</div>
        </div>
      )
    }
    default:
      return `❌ Unsupported block (${type === "unsupported" ? "unsupported by Notion API" : type
        })`;
  }
}

const renderBlock = (block, blocks) => {
  const { type, id } = block;
  const value = block[type];
  // console.log(block);
  // console.log(value);

  // if (block.has_children) {
    
    // return setType(block)

    // renderBlock(block)
  // }

  switch (type) {
    case "paragraph":
      return (
        <p>
          <Text text={value.rich_text} />
        </p>
      );
    case "heading_1":
      return (
        <h1 className=" notion-h1">
          <Text text={value.rich_text} />
        </h1>
      );
    case "heading_2":
      return (
        <h2 className="text-4xl">
          <Text text={value.rich_text} />
        </h2>
      );
    case "heading_3":
      return (
        <h3 className="notion-h notion-h3">
          <Text text={value.rich_text} />
        </h3>
      );
    case "bulleted_list": {
      // console.log("========bulleted_list");
      // console.log(value);
      return <ul className="notion-list notion-list-disc c">{value.children.map((child) => renderBlock(child))}</ul>;
    }
    case "numbered_list": {
      return <ol className="notion-list notion-list-disc">{value.children.map((child) => renderBlock(child))}</ol>;
    }
    case "bulleted_list_item":
      // console.log("========bulleted_list_item");
      // console.log(value);
      return (
        <li key={block.id}>
          <Text text={value.rich_text} />
          {!!block.children && renderNestedList(block)}
        </li>
      );
    case "numbered_list_item":
      
      return (
        <li key={block.id}>
          <Text text={value.rich_text} />
          {!!block.children && renderNestedList(block)}
        </li>
      );
    case "to_do":
      return (
        <div>
          <label htmlFor={id}>
            <input type="checkbox" id={id} defaultChecked={value.checked} />{" "}
            <Text text={value.rich_text} />
          </label>
        </div>
      );
    case "toggle":
      return (
        <details>
          <summary>
            <Text text={value.rich_text} />
          </summary>
          {block.children?.map((child) => (
            <Fragment key={child.id}>{renderBlock(child)}</Fragment>
          ))}
        </details>
      );
    case "child_page":
      return (
        <div className={styles.childPage}>
          <strong>{value.title}</strong>
          {block.children.map((child) => renderBlock(child))}
        </div>
      );
    case "image":
      const src =
        value.type === "external" ? value.external.url : value.file.url;
      const caption = value.caption ? value.caption[0]?.plain_text : "";
      return (
        <figure className="notion-asset-wrapper notion-asset-wrapper-image">
          <div className="wrap">
            <img src={src} alt={caption} />
          </div>
          {caption && <figcaption>{caption}</figcaption>}
        </figure>
      );
    case "divider":
      return <hr key={id} />;
    case "quote":
      return <blockquote className="notion-quote" key={id}>{value.rich_text[0].plain_text}</blockquote>;
    case "code":
      return (
        <pre className={styles.pre}>
          <code className={styles.code_block} key={id}>
            {value.rich_text[0].plain_text}
          </code>
        </pre>
      );
    case "file":
      const src_file =
        value.type === "external" ? value.external.url : value.file.url;
      const splitSourceArray = src_file.split("/");
      const lastElementInArray = splitSourceArray[splitSourceArray.length - 1];
      const caption_file = value.caption ? value.caption[0]?.plain_text : "";
      return (
        <figure className="notion-file ">
            
            <Link className="notion-file-link" href={src_file} passHref>
              <span><svg className="notion-file-icon" viewBox="0 0 30 30"><path d="M22,8v12c0,3.866-3.134,7-7,7s-7-3.134-7-7V8c0-2.762,2.238-5,5-5s5,2.238,5,5v12c0,1.657-1.343,3-3,3s-3-1.343-3-3V8h-2v12c0,2.762,2.238,5,5,5s5-2.238,5-5V8c0-3.866-3.134-7-7-7S6,4.134,6,8v12c0,4.971,4.029,9,9,9s9-4.029,9-9V8H22z"></path></svg></span> {lastElementInArray.split("?")[0]}
            </Link>
          {caption_file && <figcaption>{caption_file}</figcaption>}
        </figure>
      );
    case "bookmark":
      const href = value.url;
      return (
        <a href={href} target="_brank" className={styles.bookmark}>
          {href}
        </a>
      );
    case "table": {
      if (block['table'].table_width == 2) {
        return (
          <table data="2" className="charts-css column show-labels">
            
            <tbody>
              {block.children?.map((child, i) => {
                
                return (
                  <tr key={child.id}>
                    {child.table_row?.cells?.map((cell, i) => {
                      const RowElement =
                        /* value.has_column_header && */ i == 0 ? "th" : "td";
                      return (
                        // <th scope="row">2016</th>
                        <RowElement style={{ "--size": ` ${(cell[0].plain_text)}` }} key={`${cell.plain_text}-${i}`} data={i}>
                          {i == 0 ?<Text text={cell} /> : cell[0].plain_text*10000/100}{i == 1 ? "%":""}
                        </RowElement>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      } else {
        return (
          <table className={styles.table}>
            <tbody>
              {block.children?.map((child, i) => {
                const RowElement =
                  value.has_column_header && i == 0 ? "th" : "td";
                return (
                  <tr key={child.id}>
                    {child.table_row?.cells?.map((cell, i) => {
                      return (
                        <RowElement key={`${cell.plain_text}-${i}`}>
                          <Text text={cell} />
                        </RowElement>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        );
      }
      
    }
    case "column_list": {
      return (
        <div className={styles.row}>
          {block.children.map((block) => renderBlock(block))}
        </div>
      );
    }
    case "column": {
      return <div>{block.children.map((child) => renderBlock(child))}</div>;
    }
    case "callout": {
      return (
        <div className="notion-callout notion-gray_background_co">
          <div className="notion-page-icon-inline notion-page-icon-span"><span className="notion-page-icon" role="img"
            aria-label="💡">💡</span></div>
          <div className="notion-callout-text">{(value.rich_text[0].text.content)}</div>
        </div>
      )
    }
    case "child_database": {
      let name = "";
      let text = ""
      let html = ""
      // console.log(block);
      // console.log(blocks);
      // const segBeginElements = document.querySelectorAll('.seg-begin');
      // segBeginElements.forEach(element => {
      //   text = element.innerText;
      //   name = "#" + element.name
      //   html += `<a style="color:#36c;display:block;" href=${name}>- ${text}</a>`

      //   console.log(text);
      //   console.log(element.name);
      // });

      return (
          // <div dangerouslySetInnerHTML={{ __html: html }} />
          <div></div>
      )
    }
    default:
      let html = "";
      // console.log(blocks[0].id);
      // console.log(block.id);
      // console.log(block.properties['Name']?.title[0]?.plain_text);
      // toc.push(block.properties['Name']?.title[0]?.plain_text);
      // if (toc.length < 2) {
      //   blocks.map((b, i) => {
      //     // console.log(b);
      //     html += `<a style="color:#36c;display:block;margin:3px 0;overflow:hidden;cursor:pointer;" href="#${b.id}">- ${encodeURIComponent(b.properties['Name']?.title[0]?.plain_text)}</a>`
      //   })
      //   html =`<div>${html}</div><div style="position:fixed;bottom:30px;right:30px;border:1px solid #000;border-radius:50%;width:30px;height:30px;text-align:center;line-height:27px;"><a href="#">⬆️</a><div>`
      // }
      // console.log(toc);
      
      

      if (!block.type) {
        return (
          <div>
            {blocks[0].id == block.id ? (
              blocks.map((b, i) => {
                  // console.log(b);
                  let id = "#" + b.id;
                  return (
                    <a style={{ "color": "#36c", "display": "block", "margin": "3px 0", "overflow": "hidden", "cursor": "pointer" }} href={id}>- {b.properties['Name']?.title[0]?.plain_text}</a>
                  )
                  
                })

            ) : (
              <div></div>
            )}

            {blocks[0].id == block.id ? <div style={{ "position": "fixed", "bottom": "30px", "right": "30px", "border": "1px solid #000", "border-radius": "50%", "width": "30px", "height": "30px", "text-align": "center", "line-height": "30px","background": "#fff" }}><a href="#">⬆️</a></div> : ''}
            <a style={{"display":"block","height":"0","overflow":"hidden"}}  name={block.id} className="seg-begin"><h2>{block.properties['Name']?.title[0]?.plain_text}</h2></a>
          <table className={styles.table}>
            <tbody>
              {Object.keys(block.properties).reverse()?.map((child, i) => {
                // console.log(child,i);
                const RowElement = "td";
                return (
                  <tr key={i}>
                    {/* {console.log(block.properties)} */}
                    {/* {console.log(block.properties[child])} */}
                    {block.properties[child]?.title?.map((cell, i) => {
                      return (
                        <th key={`${cell.plain_text}-${i}`}>
                          {cell.plain_text}
                        </th>
                      );
                    })}
                    {block.properties[child]?.rich_text?.map((cell, i) => {
                      // { console.log(cell) }
                      return (
                        <RowElement key={`${cell.plain_text}-${i}`}>
                          {cell.plain_text}
                        </RowElement>
                      );
                    })}
                    
                  </tr>
                );
              })}
            </tbody>
          </table>
          </div>
        );
      } else {
        return `❌ Unsupported block (${type === "unsupported" ? "unsupported by Notion API" : type
          })`;
      }
      
  }
};

export default function Post({ page, blocks, database }) {
  if (!page || !blocks) {
    return <div />;
  }
  return (
    <div>
      <Head>
        <title>{page.properties.Name.title[0].plain_text}</title>
        <link rel="icon" href="https://res.suning.cn/project/cmsWeb/suning/yzsc/images/yz-icon.png" />
      </Head>

      <article className={styles.container}>
        <h1 className={styles.notionH2}>
          <Text text={page.properties.Name.title} />
        </h1>
        <section>
          {blocks.map((block) => (
            <Fragment key={block.id}>{renderBlock(block, blocks)}</Fragment>
          ))}
          {
            database.map((databases) => (
              <Fragment key={databases.id}>{renderBlock(databases, database)}</Fragment>
            ))
          }
          {/* <Link href="/" className={styles.back}>
            ← Go home
          </Link> */}
        </section>
        <footer className={styles.footer}>by zhuxiaojian</footer>
      </article>
    </div>
  );
}

export const getStaticPaths = async () => {
  const database = await getDatabase(databaseId);

  return {
    paths: database.map((page) => ({ params: { id: page.id, page_id: database.id} })),
    fallback: true
  };
};

export const getStaticProps = async (context) => {
  const { id } = context.params;

  const page = await getPage(id);
  const blocks = await getBlocks(id);
  let database = []
  if (page.id == "67c82e16-b73d-44d8-9f38-da979f879412") {
    database = await getDatabase('452b268455aa40f5bae6db8669344ed6')
  }
  console.log(database);
  console.log(page);

  return {
    props: {
      page,
      blocks,
      database
    },
    revalidate: 1,
  };
};
